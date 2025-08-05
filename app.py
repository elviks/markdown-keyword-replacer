from flask import Flask, render_template, request
import re
import random
import markdown

app = Flask(__name__)

def markdown_to_html(markdown_text):
    """Convert Markdown text to HTML with proper formatting."""
    if not markdown_text:
        return ""
    
    # Configure markdown with basic extensions
    try:
        md = markdown.Markdown(extensions=[
            'extra',      # Adds support for tables, fenced code blocks, etc.
            'codehilite', # Syntax highlighting for code blocks
            'toc',        # Table of contents
        ])
    except Exception:
        # Fallback to basic markdown if extensions fail
        md = markdown.Markdown()
    
    return md.convert(markdown_text)

# Global replacement pool for managing distribution across entire article
class ReplacementPool:
    def __init__(self, variants_with_priority):
        self.variants_with_priority = variants_with_priority
        self.priority_percentages = {
            1: 50,  # Priority 1 gets 50% of all replacements
            2: 25,  # Priority 2 gets 25% of all replacements  
            3: 15,  # Priority 3 gets 15% of all replacements
            4: 7,   # Priority 4 gets 7% of all replacements
            5: 3    # Priority 5 gets 3% of all replacements
        }
        self.replacement_pool = []
        self.pool_index = 0
        
    def initialize_pool(self, total_article_replacements):
        """Initialize the replacement pool based on priority percentages"""
        if total_article_replacements <= 0:
            return
            
        # Filter valid variants
        valid_variants = [v for v in self.variants_with_priority if v.get('text', '').strip()]
        if not valid_variants:
            return
            
        # Calculate replacements for each priority level
        priority_counts = {}
        remaining_replacements = total_article_replacements
        
        # Group variants by priority
        variants_by_priority = {}
        for variant in valid_variants:
            priority = variant.get('priority', 3)
            if priority not in variants_by_priority:
                variants_by_priority[priority] = []
            variants_by_priority[priority].append(variant['text'])
        
        # Calculate counts for each priority level
        for priority in sorted(variants_by_priority.keys()):
            if priority in self.priority_percentages:
                percentage = self.priority_percentages[priority]
                count = max(1, int(total_article_replacements * percentage / 100))
                count = min(count, remaining_replacements)  # Don't exceed remaining
                priority_counts[priority] = count
                remaining_replacements -= count
        
        # Distribute any remaining replacements to Priority 1
        if remaining_replacements > 0 and 1 in priority_counts:
            priority_counts[1] += remaining_replacements
        
        # Build the replacement pool
        self.replacement_pool = []
        for priority, count in priority_counts.items():
            if priority in variants_by_priority:
                variants = variants_by_priority[priority]
                # Distribute count among variants of this priority
                variants_count = len(variants)
                for i in range(count):
                    variant_text = variants[i % variants_count]  # Cycle through variants
                    self.replacement_pool.append(variant_text)
        
        # Shuffle the pool to randomize order
        random.shuffle(self.replacement_pool)
        
        print(f"[DEBUG] Replacement pool initialized:")
        print(f"  Total replacements: {total_article_replacements}")
        print(f"  Priority counts: {priority_counts}")
        print(f"  Pool size: {len(self.replacement_pool)}")
        print(f"  Pool preview: {self.replacement_pool[:10]}...")
        
    def get_next_replacement(self):
        """Get the next replacement from the pool"""
        if not self.replacement_pool:
            return None
            
        if self.pool_index >= len(self.replacement_pool):
            # If we've exhausted the pool, reshuffle and start over
            random.shuffle(self.replacement_pool)
            self.pool_index = 0
            
        replacement = self.replacement_pool[self.pool_index]
        self.pool_index += 1
        return replacement

# Global pool instance
replacement_pool = None

def apply_section_tail_filter(text_block, tail_skip_amount):
    """
    Apply section tail filtering - skip percentage from the top and only process the tail.
    Returns tuple: (skipped_content, processable_content)
    """
    if not tail_skip_amount or not text_block.strip():
        return "", text_block
    
    lines = text_block.splitlines(keepends=True)
    total_lines = len(lines)
    
    # If section is very small, be less aggressive
    if total_lines <= 3:
        print(f"[DEBUG] Section tail: Section too small ({total_lines} lines), keeping all content")
        return "", text_block
    
    try:
        # Only handle percentage now
        if not tail_skip_amount.startswith('percent:'):
            print(f"[DEBUG] Invalid tail_skip_amount format: {tail_skip_amount}. Expected 'percent:XX'")
            return "", text_block
            
        skip_value = int(tail_skip_amount.split(':')[1])
        skip_fraction = min(skip_value / 100.0, 0.75)  # Cap at 75%
        skip_lines = int(total_lines * skip_fraction)
        
        # Ensure we keep at least 2 lines
        skip_lines = min(skip_lines, total_lines - 2)
        
        if skip_lines > 0:
            skipped_content = ''.join(lines[:skip_lines])
            processable_content = ''.join(lines[skip_lines:])
            print(f"[DEBUG] Section tail (percent): Skipped {skip_lines}/{total_lines} lines ({skip_value}% capped), remaining: {len(lines[skip_lines:])} lines")
            return skipped_content, processable_content
        else:
            print(f"[DEBUG] Section tail (percent): No lines to skip, keeping all content")
            return "", text_block
                    
    except (ValueError, IndexError):
        print(f"[DEBUG] Invalid tail_skip_amount format: {tail_skip_amount}")
        return "", text_block
    
    return "", text_block

def should_skip_content(text_line, skip_headers, skip_tables):
    """
    Check if a line should be skipped based on settings.
    """
    stripped = text_line.strip()
    
    if skip_headers and stripped.startswith('#'):
        return True
        
    if skip_tables and ('|' in stripped and stripped.count('|') >= 2):
        return True
        
    return False

def replace_keywords_in_section(text_block, main_keyword, variants_with_priority, percentage, exclusion_keywords, skip_headers=True, skip_tables=True, section_tail_mode=False, tail_skip_amount='percent:50'):
    print(f"[DEBUG] replace_keywords_in_section called.")
    print(f"  text_block (first 200): {text_block[:200]}...")
    print(f"  main_keyword: '{main_keyword}'")
    print(f"  variants_with_priority: {variants_with_priority}") # Now a list of dicts
    print(f"  percentage: {percentage}")
    print(f"  exclusion_keywords: {exclusion_keywords}")
    print(f"  skip_headers: {skip_headers}, skip_tables: {skip_tables}")
    print(f"  section_tail_mode: {section_tail_mode}, tail_skip_amount: {tail_skip_amount}")

    # Check for exclusion keywords first
    if exclusion_keywords:
        for ex_keyword in exclusion_keywords:
            if ex_keyword.lower() in text_block.lower(): # Case-insensitive check for exclusion
                print(f"[DEBUG] Exclusion keyword '{ex_keyword}' found in block. Skipping replacement for this block.")
                return text_block 
    
    # Handle line-by-line skipping for headers and tables FIRST
    original_text_block = text_block
    processable_content = text_block
    skipped_line_info = []
    
    if skip_headers or skip_tables:
        lines = text_block.splitlines(keepends=True)
        processable_lines = []
        
        for i, line in enumerate(lines):
            if should_skip_content(line, skip_headers, skip_tables):
                skipped_line_info.append((i, line))
                print(f"[DEBUG] Will skip line {i}: {line.strip()[:50]}...")
            else:
                processable_lines.append(line)
        
        if processable_lines:
            processable_content = ''.join(processable_lines)
            print(f"[DEBUG] After header/table filtering: {len(processable_lines)} processable lines out of {len(lines)} total")
        else:
            print(f"[DEBUG] All lines would be skipped by header/table rules. Processing original content.")
            processable_content = text_block
            skipped_line_info = []  # Don't skip anything if everything would be skipped
    
    # Apply section tail filtering to the processable content
    section_tail_skipped_content = ""
    if section_tail_mode and processable_content.strip():
        skipped_content, filtered_content = apply_section_tail_filter(processable_content, tail_skip_amount)
        if filtered_content.strip() and len(filtered_content.strip()) >= 10:  # Ensure meaningful content remains
            section_tail_skipped_content = skipped_content
            processable_content = filtered_content
            print(f"[DEBUG] Section tail applied to processable content. New block (first 200): {processable_content[:200]}...")
        else:
            print(f"[DEBUG] Section tail filtering resulted in insufficient content ({len(filtered_content.strip())} chars). Using original processable content.")
    
    # Process the final processable content
    if not processable_content.strip():
        print(f"[DEBUG] No processable content remaining. Returning original block.")
        return original_text_block
    
    # Process the content for keyword replacement
    processed_text = process_text_for_keywords(processable_content, main_keyword, variants_with_priority, percentage)
    
    # Combine section tail skipped content with processed content
    if section_tail_skipped_content:
        processed_text = section_tail_skipped_content + processed_text
        print(f"[DEBUG] Combined section tail skipped content with processed content.")
    
    # If we had skipped lines, reconstruct the full text
    if skipped_line_info and processed_text != original_text_block:
        # Reconstruct with skipped lines in their original positions
        original_lines = original_text_block.splitlines(keepends=True)
        processed_lines = processed_text.splitlines(keepends=True)
        
        result_lines = []
        processed_idx = 0
        
        for i, original_line in enumerate(original_lines):
            # Check if this line was skipped
            was_skipped = any(skip_i == i for skip_i, _ in skipped_line_info)
            
            if was_skipped:
                result_lines.append(original_line)  # Keep original skipped line
            else:
                # Use processed version if available
                if processed_idx < len(processed_lines):
                    result_lines.append(processed_lines[processed_idx])
                    processed_idx += 1
                else:
                    result_lines.append(original_line)  # Fallback to original
        
        result = ''.join(result_lines)
        print(f"[DEBUG] Block processed with line reconstruction. Result (first 200): {result[:200]}...")
        return result
    else:
        # No skipped lines or no changes made
        result = processed_text if processed_text != processable_content else original_text_block
        print(f"[DEBUG] Block processed normally. Result (first 200): {result[:200]}...")
        return result

def process_text_for_keywords(text_block, main_keyword, variants_with_priority, percentage):
    """Core keyword replacement logic without line-level filtering."""
    # If no main keyword, or percentage is zero, or no valid variants_with_priority for replacement
    valid_variants_exist = any(v.get('text') for v in variants_with_priority)

    if not main_keyword or percentage == 0 or not valid_variants_exist:
        return text_block

    pattern = r'\b' + re.escape(main_keyword) + r'\b' 
    matches = list(re.finditer(pattern, text_block, re.IGNORECASE))
    
    if not matches:
        return text_block

    num_to_replace = int(len(matches) * (percentage / 100))
    if num_to_replace == 0 and percentage > 0 and len(matches) > 0:
        num_to_replace = 1 

    if num_to_replace == 0:
        return text_block

    # Use global replacement pool
    global replacement_pool
    if not replacement_pool:
        return text_block
    
    # Select random indices to replace
    indices_to_replace = random.sample(range(len(matches)), num_to_replace)
    replacement_map = {}
    
    print(f"[DEBUG] Getting {num_to_replace} replacements from pool...")
    
    for match_index in indices_to_replace:
        match = matches[match_index]
        # Get next replacement from the pool
        replacement_variant = replacement_pool.get_next_replacement()
        if replacement_variant:
            replacement_map[match.start()] = (match, replacement_variant)
            print(f"[DEBUG] Assigned '{replacement_variant}' to position {match.start()}")
        else:
            print("[DEBUG] No more replacements available in pool")
            break

    last_end = 0
    output_parts = []
    for match_start_original_index in sorted(replacement_map.keys()):
        match_obj, chosen_variant = replacement_map[match_start_original_index]
        start, end = match_obj.start(), match_obj.end()
        output_parts.append(text_block[last_end:start])
        original_word = text_block[start:end]
        
        # Apply case preservation
        if original_word and original_word[0].isupper() and len(original_word) > 1 and chosen_variant:
            chosen_variant = chosen_variant[0].upper() + chosen_variant[1:]
        elif original_word and original_word.isupper() and chosen_variant:
            chosen_variant = chosen_variant.upper()
        
        output_parts.append(chosen_variant)
        last_end = end
    output_parts.append(text_block[last_end:])
    return "".join(output_parts)

@app.route('/', methods=['GET', 'POST'])
def index():
    processed_article = ''
    article_md_val = ''
    main_keyword_val = ''
    keyword_variants_for_repopulation = '' # This will store "text1:prio1,text2:prio2,..."
    exclusion_keywords_for_repopulation = '' 
    replacement_percentage_val = '10'
    error_message = None

    if request.method == 'POST':
        article_md_val = request.form.get('article_md', '')
        article_with_markers = request.form.get('article_with_markers', article_md_val)
        main_keyword_val = request.form.get('main_keyword', '').strip()
        
        # This string is "text1:prio1,text2:prio2,..."
        keyword_variants_str_with_priority = request.form.get('keyword_variants_concatenated', '')
        exclusion_keywords_str = request.form.get('exclusion_keywords_concatenated', '') 
        replacement_percentage_str = request.form.get('replacement_percentage', '10')
        
        # New settings
        skip_headers = request.form.get('skip_headers', 'true') == 'true'
        skip_tables = request.form.get('skip_tables', 'true') == 'true'  
        section_tail_mode = request.form.get('section_tail_mode', 'false') == 'true'
        tail_skip_amount = request.form.get('tail_skip_amount', 'percent:50')

        print(f"--- app.py DEBUG: POST Request Data ---")
        print(f"Main Keyword: '{main_keyword_val}'")
        print(f"Keyword Variants String (with priority): '{keyword_variants_str_with_priority}'")
        print(f"Exclusion Keywords String: '{exclusion_keywords_str}'")
        print(f"Replacement Percentage: '{replacement_percentage_str}'")
        print(f"Skip Headers: {skip_headers}")
        print(f"Skip Tables: {skip_tables}")
        print(f"Section Tail Mode: {section_tail_mode}")
        print(f"Tail Skip Amount: '{tail_skip_amount}'")
        print(f"article_with_markers (first 100): {article_with_markers[:100]}...")
        
        # IMPORTANT: Warn if section tail mode is enabled
        if section_tail_mode:
            print(f"[WARNING] Section Tail Mode is ENABLED - this will skip the first {tail_skip_amount.split(':')[1] if ':' in tail_skip_amount else '50'}% of each section!")
            print(f"[WARNING] This may cause uneven distribution of replacements across your article!")
        else:
            print(f"[INFO] Section Tail Mode is disabled - replacements will be distributed throughout each section")

        # For repopulating the form, we pass back the exact string received
        keyword_variants_for_repopulation = keyword_variants_str_with_priority
        exclusion_keywords_for_repopulation = exclusion_keywords_str 

        try:
            replacement_percentage = float(replacement_percentage_str)
            if not (0 <= replacement_percentage <= 100):
                raise ValueError("Percentage must be between 0 and 100.")
        except ValueError as e:
            error_message = str(e)
            # Ensure all repopulation strings are passed
            return render_template('index.html', error=error_message, article_md=article_md_val,
                                   main_keyword=main_keyword_val,
                                   keyword_variants_for_repopulation=keyword_variants_for_repopulation,
                                   exclusion_keywords_for_repopulation=exclusion_keywords_for_repopulation,
                                   replacement_percentage=replacement_percentage_str, processed_article='')

        # Parse keyword_variants_str_with_priority into list of dicts
        parsed_variants_with_priority = []
        if keyword_variants_str_with_priority:
            pairs = keyword_variants_str_with_priority.split(',')
            for pair_str in pairs:
                if ':' in pair_str:
                    text, _, prio_str = pair_str.partition(':')
                    text = text.strip()
                    try:
                        priority = int(prio_str.strip())
                        if not 1 <= priority <= 5: # Validate priority range
                            priority = 3 # Default if out of range
                    except ValueError:
                        priority = 3 # Default if not an int
                    if text: # Only add if text is not empty
                         parsed_variants_with_priority.append({'text': text, 'priority': priority})
                elif pair_str.strip(): # If no colon, but text exists, assume default priority
                    parsed_variants_with_priority.append({'text': pair_str.strip(), 'priority': 3})


        exclusion_keywords = [ek.strip() for ek in exclusion_keywords_str.split(',') if ek.strip()]
        
        print(f"Parsed Keyword Variants (with priority): {parsed_variants_with_priority}")
        print(f"Parsed Exclusion Keywords List: {exclusion_keywords}")

        processed_article_parts = []
        # This global header_pattern is used by replace_keywords_in_section for general header skipping (H1-H6)
        header_pattern = re.compile(r'^#{1,6}\s+.*') 
        start_delimiter = "%%%START_REPLACE%%%"
        end_delimiter = "%%%END_REPLACE%%%"
        user_selected_sections = start_delimiter in article_with_markers
        print(f"User selected specific sections: {user_selected_sections}")

        perform_replacement = True
        # Check if there are any actual variant texts, not just empty strings or only priorities
        has_valid_variants_for_processing = any(v.get('text') for v in parsed_variants_with_priority)
        if not main_keyword_val.strip() or not has_valid_variants_for_processing:
            if not main_keyword_val.strip():
                print("[INFO] Main keyword is empty. No replacements will be performed.")
            if not has_valid_variants_for_processing:
                print("[INFO] No valid keyword variants provided (all empty or just priorities). No replacements will be performed.")
            perform_replacement = False # Prevent replacement if no main keyword or no variant text

        effective_main_keyword = main_keyword_val # Use the one from the form

        # Initialize the replacement pool for this request if variants exist
        global replacement_pool
        if parsed_variants_with_priority and perform_replacement:
            # Count total matches across entire article to initialize pool
            pattern = r'\b' + re.escape(main_keyword_val) + r'\b'
            total_matches = len(re.findall(pattern, article_md_val, re.IGNORECASE))
            total_replacements_needed = int(total_matches * (replacement_percentage / 100))
            
            if total_replacements_needed > 0:
                replacement_pool = ReplacementPool(parsed_variants_with_priority)
                replacement_pool.initialize_pool(total_replacements_needed)
                print(f"[DEBUG] ReplacementPool initialized with {len(replacement_pool.replacement_pool)} items for {total_replacements_needed} total replacements from {total_matches} matches.")
            else:
                replacement_pool = None
                print(f"[DEBUG] No replacements needed. Found {total_matches} matches, but calculated {total_replacements_needed} replacements needed.")
        else:
            replacement_pool = None # Ensure it's None if no variants or no replacement

        if user_selected_sections:
            print("Processing user-selected sections from article_with_markers...")
            lines = article_with_markers.splitlines(keepends=True)
            in_specific_replace_section = False
            current_accumulated_lines_for_processing = []
            lines_outside_current_processing_block = []

            for line_idx, line in enumerate(lines):
                stripped_line = line.strip()
                if stripped_line == start_delimiter:
                    processed_article_parts.extend(lines_outside_current_processing_block)
                    lines_outside_current_processing_block = []
                    in_specific_replace_section = True
                elif stripped_line == end_delimiter:
                    if in_specific_replace_section:
                        block_to_process = "".join(current_accumulated_lines_for_processing)
                        processed_block = replace_keywords_in_section(
                            block_to_process, 
                            effective_main_keyword, 
                            parsed_variants_with_priority, 
                            replacement_percentage, 
                            exclusion_keywords,
                            skip_headers=skip_headers,
                            skip_tables=skip_tables,
                            section_tail_mode=section_tail_mode,
                            tail_skip_amount=tail_skip_amount
                        )
                        processed_article_parts.append(processed_block)
                        current_accumulated_lines_for_processing = []
                        in_specific_replace_section = False
                    else: # End delimiter without start, treat as normal text
                        lines_outside_current_processing_block.append(line)
                elif in_specific_replace_section:
                    if header_pattern.match(line): # Header inside replace section
                        # Process accumulated block before header
                        if current_accumulated_lines_for_processing:
                            block_to_process = "".join(current_accumulated_lines_for_processing)
                            processed_block = replace_keywords_in_section(
                                block_to_process, 
                                effective_main_keyword, 
                                parsed_variants_with_priority, 
                                replacement_percentage, 
                                exclusion_keywords,
                                skip_headers=skip_headers,
                                skip_tables=skip_tables,
                                section_tail_mode=section_tail_mode,
                                tail_skip_amount=tail_skip_amount
                            )
                            processed_article_parts.append(processed_block)
                            current_accumulated_lines_for_processing = []
                        processed_article_parts.append(line) # Add header as is
                    else:
                        current_accumulated_lines_for_processing.append(line)
                else: # Outside any specific replace section or after a section is closed
                    lines_outside_current_processing_block.append(line)
            
            # Add any remaining lines from outside processing blocks
            processed_article_parts.extend(lines_outside_current_processing_block)
            # If a START was found but no END, process the remaining accumulated lines
            if in_specific_replace_section and current_accumulated_lines_for_processing:
                block_to_process = "".join(current_accumulated_lines_for_processing)
                processed_block = replace_keywords_in_section(
                    block_to_process, 
                    effective_main_keyword, 
                    parsed_variants_with_priority, 
                    replacement_percentage, 
                    exclusion_keywords,
                    skip_headers=skip_headers,
                    skip_tables=skip_tables,
                    section_tail_mode=section_tail_mode,
                    tail_skip_amount=tail_skip_amount
                )
                processed_article_parts.append(processed_block)
            
            processed_article = "".join(processed_article_parts)

        else: # No user-selected sections, process entire article body
            if not perform_replacement or replacement_percentage == 0:
                 print("Conditions not met for full article replacement. Returning original.")
                 processed_article = article_md_val
            else:
                print("Processing entire article body (H2-defined sections for tail targeting if enabled)...")
                lines = article_md_val.splitlines(keepends=True)
                current_h2_block_for_processing = [] # Content between H2s (or start/end of doc relative to H2s)
                
                h2_pattern = re.compile(r'^##\s+.*')
                # The global header_pattern (r'^#{1,6}\s+.*') is used inside replace_keywords_in_section
                # for skipping H1, H3-H6 if skip_headers is true.

                for line_idx, line in enumerate(lines):
                    is_h2_header = h2_pattern.match(line)
                    
                    if is_h2_header:
                        # Process the accumulated block before this H2
                        if current_h2_block_for_processing:
                            block_content = "".join(current_h2_block_for_processing)
                            processed_article_parts.append(replace_keywords_in_section(
                                block_content, 
                                main_keyword_val, # Use main_keyword_val directly as effective_main_keyword scope is different
                                parsed_variants_with_priority, 
                                replacement_percentage, 
                                exclusion_keywords,
                                skip_headers=skip_headers, 
                                skip_tables=skip_tables,
                                section_tail_mode=section_tail_mode,
                                tail_skip_amount=tail_skip_amount
                            ))
                            current_h2_block_for_processing = [] # Reset for next H2-section
                        
                        processed_article_parts.append(line) # Add the H2 header line itself, unprocessed
                    else:
                        # This line is not an H2 header. It could be H1, H3-H6, or regular content.
                        # Add it to the current block being accumulated for an H2-section.
                        current_h2_block_for_processing.append(line)
                
                # After the loop, process any remaining accumulated block
                if current_h2_block_for_processing:
                    block_content = "".join(current_h2_block_for_processing)
                    processed_article_parts.append(replace_keywords_in_section(
                        block_content, 
                        main_keyword_val, # Use main_keyword_val directly
                        parsed_variants_with_priority, 
                        replacement_percentage, 
                        exclusion_keywords,
                        skip_headers=skip_headers,
                        skip_tables=skip_tables,
                        section_tail_mode=section_tail_mode,
                        tail_skip_amount=tail_skip_amount
                    ))
                
                processed_article = "".join(processed_article_parts)
        
        # Show final processing summary
        print(f"\n[FINAL PROCESSING SUMMARY]")
        print(f"Original article length: {len(article_md_val)} characters")
        print(f"Processed article length: {len(processed_article)} characters")
        print(f"Processing method: {'User-selected sections' if user_selected_sections else 'Entire article body'}")
        if replacement_pool:
            total_pool_size = len(replacement_pool.replacement_pool)
            used_replacements = replacement_pool.pool_index
            print(f"Total replacements made: {used_replacements}/{total_pool_size}")
        print(f"[END SUMMARY]\n")
        
        # Show a portion of the final processed article for verification
        print(f"[PROCESSED ARTICLE PREVIEW]")
        preview_length = min(1000, len(processed_article))
        print(f"First {preview_length} characters of processed article:")
        print(f"{'='*50}")
        print(processed_article[:preview_length])
        if len(processed_article) > preview_length:
            print(f"... (and {len(processed_article) - preview_length} more characters)")
        print(f"{'='*50}")
        print(f"[END PREVIEW]\\n")
        
        # Convert both input and output to HTML for preview
        article_html = markdown_to_html(article_md_val)
        processed_article_html = markdown_to_html(processed_article)
        
        return render_template('index.html',
                               processed_article=processed_article,
                               processed_article_html=processed_article_html,
                               article_md=article_md_val,
                               article_html=article_html,
                               main_keyword=main_keyword_val,
                               keyword_variants_for_repopulation=keyword_variants_for_repopulation,
                               exclusion_keywords_for_repopulation=exclusion_keywords_for_repopulation,
                               replacement_percentage=str(replacement_percentage), # ensure it's string
                               skip_headers=skip_headers, # Pass back to template
                               skip_tables=skip_tables,   # Pass back to template
                               section_tail_mode=section_tail_mode, # Pass back to template
                               tail_skip_amount=tail_skip_amount, # Pass back to template
                               error=error_message)

    # GET request handling
    # For GET, we want the first variant/exclusion input fields to be empty unless we have defaults
    first_variant_initial_repop = '' # e.g. "myDefaultVariant:3" or empty for no default
    first_exclusion_initial_repop = ''

    return render_template('index.html', processed_article='', article_md=article_md_val,
                           processed_article_html='',
                           article_html=markdown_to_html(article_md_val),
                           main_keyword=main_keyword_val,
                           keyword_variants_for_repopulation=first_variant_initial_repop,
                           exclusion_keywords_for_repopulation=first_exclusion_initial_repop,
                           replacement_percentage=replacement_percentage_val, 
                           skip_headers=True, # Default for GET
                           skip_tables=True,  # Default for GET
                           section_tail_mode=False, # Default for GET
                           tail_skip_amount='percent:50', # Default for GET
                           error=error_message)

if __name__ == '__main__':
    app.run(debug=True) 
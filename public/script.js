let selectedSections = []; // Stores {id, start, end, textSnippet} objects
let currentInputView = 'markdown'; // 'markdown' or 'html'
let currentOutputView = 'markdown'; // 'markdown' or 'html'

document.addEventListener('DOMContentLoaded', () => {
    console.log("[DEBUG] DOMContentLoaded event fired.");

    const addSelectedSectionBtn = document.getElementById('addSelectedSectionBtn');
    const processArticleBtn = document.getElementById('processArticleBtn');
    const loadDemoDataBtn = document.getElementById('loadDemoDataBtn');
    const articleTextarea = document.getElementById('article_md');
    const queuedSectionsListUI = document.getElementById('queuedSectionsList');
    const articleForm = document.getElementById('articleForm');
    const hiddenInputArticleWithMarkers = document.getElementById('article_with_markers_hidden_input');

    // New selectors for sidebar controls and dynamic variants
    const mainKeywordInput = document.getElementById('main_keyword'); // In sidebar
    const replacementPercentageInput = document.getElementById('replacement_percentage'); // In sidebar
    const keywordVariantsContainer = document.getElementById('keyword-variants-container');
    const addVariantBtn = document.getElementById('addVariantBtn');
    
    // New settings controls
    const skipHeadersInput = document.getElementById('skip_headers');
    const skipTablesInput = document.getElementById('skip_tables');
    const sectionTailModeInput = document.getElementById('section_tail_mode');
    const tailSkipAmountInput = document.getElementById('tail_skip_amount');
    const tailSettingsDiv = document.getElementById('tailSettings');
    
    // Hidden form fields to mirror sidebar controls
    const mainKeywordFormMirror = document.getElementById('main_keyword_form_mirror');
    const replacementPercentageFormMirror = document.getElementById('replacement_percentage_form_mirror');
    const keywordVariantsConcatenatedHiddenInput = document.getElementById('keyword_variants_concatenated_hidden_input');
    const skipHeadersFormMirror = document.getElementById('skip_headers_form_mirror');
    const skipTablesFormMirror = document.getElementById('skip_tables_form_mirror');
    const sectionTailModeFormMirror = document.getElementById('section_tail_mode_form_mirror');
    const tailSkipAmountFormMirror = document.getElementById('tail_skip_amount_form_mirror');

    // --- Exclusion Keywords - NEW SELECTORS ---
    const exclusionKeywordsContainer = document.getElementById('exclusion-keywords-container');
    const addExclusionBtn = document.getElementById('addExclusionBtn');
    const exclusionKeywordsConcatenatedHiddenInput = document.getElementById('exclusion_keywords_concatenated_hidden_input');

    // --- HTML Preview Toggle Elements ---
    const inputMarkdownBtn = document.getElementById('inputMarkdownBtn');
    const inputHtmlBtn = document.getElementById('inputHtmlBtn');
    const outputMarkdownBtn = document.getElementById('outputMarkdownBtn');
    const outputHtmlBtn = document.getElementById('outputHtmlBtn');
    const articleHtmlPreview = document.getElementById('article_html_preview');
    const processedArticleDisplay = document.getElementById('processed_article_display');
    const processedArticleHtmlPreview = document.getElementById('processed_article_html_preview');

    if (!exclusionKeywordsContainer) {
        console.error("[DEBUG] CRITICAL: exclusionKeywordsContainer (id: exclusion-keywords-container) NOT FOUND.");
    }
    if (!addExclusionBtn) {
        console.error("[DEBUG] CRITICAL: addExclusionBtn (id: addExclusionBtn) NOT FOUND.");
    }
    if (!exclusionKeywordsConcatenatedHiddenInput) {
        console.error("[DEBUG] CRITICAL: exclusionKeywordsConcatenatedHiddenInput (id: exclusion_keywords_concatenated_hidden_input) NOT FOUND.");
    }
    // --- End of Exclusion Keywords New Selectors ---

    // HTML Preview Toggle Functionality
    function toggleInputView(viewType) {
        currentInputView = viewType;
        if (viewType === 'markdown') {
            articleTextarea.style.display = 'block';
            articleHtmlPreview.style.display = 'none';
            inputMarkdownBtn.classList.add('active');
            inputHtmlBtn.classList.remove('active');
        } else {
            articleTextarea.style.display = 'none';
            articleHtmlPreview.style.display = 'block';
            inputMarkdownBtn.classList.remove('active');
            inputHtmlBtn.classList.add('active');
        }
    }

    function toggleOutputView(viewType) {
        currentOutputView = viewType;
        if (viewType === 'markdown') {
            processedArticleDisplay.style.display = 'block';
            processedArticleHtmlPreview.style.display = 'none';
            outputMarkdownBtn.classList.add('active');
            outputHtmlBtn.classList.remove('active');
        } else {
            processedArticleDisplay.style.display = 'none';
            processedArticleHtmlPreview.style.display = 'block';
            outputMarkdownBtn.classList.remove('active');
            outputHtmlBtn.classList.add('active');
        }
    }

    // Add event listeners for toggle buttons
    if (inputMarkdownBtn) {
        inputMarkdownBtn.addEventListener('click', () => toggleInputView('markdown'));
    }
    if (inputHtmlBtn) {
        inputHtmlBtn.addEventListener('click', () => toggleInputView('html'));
    }
    if (outputMarkdownBtn) {
        outputMarkdownBtn.addEventListener('click', () => toggleOutputView('markdown'));
    }
    if (outputHtmlBtn) {
        outputHtmlBtn.addEventListener('click', () => toggleOutputView('html'));
    }

    // Auto-resize textarea logic
    function autoResizeTextarea(textarea) {
        if (!textarea) return;
        textarea.style.height = 'auto'; // Temporarily shrink to get correct scrollHeight
        textarea.style.height = (textarea.scrollHeight) + 'px';
    }

    // Section tail mode toggle functionality
    if (sectionTailModeInput && tailSettingsDiv) {
        sectionTailModeInput.addEventListener('change', () => {
            if (sectionTailModeInput.checked) {
                tailSettingsDiv.classList.remove('is-hidden');
            } else {
                tailSettingsDiv.classList.add('is-hidden');
            }
        });
        // Ensure correct initial state on page load based on class already set by Jinja
        if (sectionTailModeInput.checked) {
            tailSettingsDiv.classList.remove('is-hidden');
        } else {
            tailSettingsDiv.classList.add('is-hidden');
        }
    }

    if (articleTextarea) {
        articleTextarea.addEventListener('input', function() {
            autoResizeTextarea(this);
            // Update HTML preview if currently viewing HTML
            if (currentInputView === 'html') {
                updateInputHtmlPreview();
            }
        });
        // Initial resize in case of pre-filled content (e.g., after form error)
        autoResizeTextarea(articleTextarea);
    } else {
        if (!articleTextarea) console.warn("[DEBUG] articleTextarea not found for event listener.");
    }

    // Function to update input HTML preview
    function updateInputHtmlPreview() {
        if (articleTextarea && articleHtmlPreview) {
            const markdownContent = articleTextarea.value;
            // For real-time preview, we'd need to call the server or use a client-side markdown parser
            // For now, we'll just show a message that the preview will update after processing
            if (markdownContent.trim()) {
                articleHtmlPreview.innerHTML = '<p><em>HTML preview will update after processing. Switch to Markdown view to see your input.</em></p>';
            } else {
                articleHtmlPreview.innerHTML = '<p><em>Enter some Markdown content to see the HTML preview.</em></p>';
            }
        }
    }

    if (addSelectedSectionBtn) {
        addSelectedSectionBtn.addEventListener('click', () => {
            const start = articleTextarea.selectionStart;
            const end = articleTextarea.selectionEnd;
            const selectedText = articleTextarea.value.substring(start, end);

            if (start === end || !selectedText.trim()) {
                alert('Please highlight some text in the article first.');
                return;
            }

            for (const section of selectedSections) {
                if (Math.max(start, section.start) < Math.min(end, section.end)) {
                    alert('The new selection overlaps with an existing queued section. Please select a non-overlapping section or remove the existing one.');
                    return;
                }
            }

            const newSection = {
                id: Date.now(),
                start: Math.min(start, end),
                end: Math.max(start, end),
                textSnippet: selectedText.substring(0, 50) + (selectedText.length > 50 ? '...' : '')
            };
            selectedSections.push(newSection);
            renderQueuedSections();
        });
    } else {
        if (!addSelectedSectionBtn) console.warn("[DEBUG] addSelectedSectionBtn not found for event listener.");
    }

    if (processArticleBtn) {
        processArticleBtn.addEventListener('click', () => {
            console.log("[DEBUG] 'Process Article' button clicked.");
            // 1. Populate hidden mirror fields from sidebar controls
            if (mainKeywordInput && mainKeywordFormMirror) {
                mainKeywordFormMirror.value = mainKeywordInput.value;
            }
            if (replacementPercentageInput && replacementPercentageFormMirror) {
                replacementPercentageFormMirror.value = replacementPercentageInput.value;
            }
            
            // Mirror new settings
            if (skipHeadersInput && skipHeadersFormMirror) {
                skipHeadersFormMirror.value = skipHeadersInput.checked ? 'true' : 'false';
            }
            if (skipTablesInput && skipTablesFormMirror) {
                skipTablesFormMirror.value = skipTablesInput.checked ? 'true' : 'false';
            }
            if (sectionTailModeInput && sectionTailModeFormMirror) {
                sectionTailModeFormMirror.value = sectionTailModeInput.checked ? 'true' : 'false';
            }
            if (tailSkipAmountInput && tailSkipAmountFormMirror) {
                tailSkipAmountFormMirror.value = tailSkipAmountInput.value;
            }

            // 2. Collect Variants with Priority
            const variantTextInputs = document.querySelectorAll('.keyword-variant-input-text');
            const variantPrioritySelects = document.querySelectorAll('.keyword-variant-input-priority');
            const variantsData = [];
            
            for (let i = 0; i < variantTextInputs.length; i++) {
                const text = variantTextInputs[i].value.trim();
                const priority = (variantPrioritySelects[i] && variantPrioritySelects[i].value) 
                                 ? variantPrioritySelects[i].value 
                                 : '3';
                if (text) {
                    variantsData.push(`${text}:${priority}`);
                }
            }
            if (keywordVariantsConcatenatedHiddenInput) {
                keywordVariantsConcatenatedHiddenInput.value = variantsData.join(',');
                console.log("[DEBUG] Variants for submission (text:priority):", keywordVariantsConcatenatedHiddenInput.value);
            }

            // 3. Collect and concatenate exclusion keywords - NEW
            const currentExclusionKeywordsContainer = document.getElementById('exclusion-keywords-container'); // Re-fetch for safety
            const exclusionInputs = currentExclusionKeywordsContainer ? currentExclusionKeywordsContainer.querySelectorAll('.exclusion-keyword-input') : [];
            const exclusions = [];
            exclusionInputs.forEach(input => {
                if (input.value.trim() !== '') {
                    exclusions.push(input.value.trim());
                }
            });
            if (exclusionKeywordsConcatenatedHiddenInput) {
                exclusionKeywordsConcatenatedHiddenInput.value = exclusions.join(',');
                console.log("[DEBUG] Exclusions for submission:", exclusionKeywordsConcatenatedHiddenInput.value);
            }
            // --- End of Exclusion Keywords Collection ---

            // 4. Prepare article with markers (existing logic)
            const originalText = articleTextarea.value;
            if (selectedSections.length === 0) {
                hiddenInputArticleWithMarkers.value = originalText;
            } else {
                let textSegments = [];
                let lastEnd = 0;

                const sortedSelections = [...selectedSections].sort((a, b) => a.start - b.start);

                sortedSelections.forEach(section => {
                    textSegments.push(originalText.substring(lastEnd, section.start));
                    
                    let startMarkerPrefix = "\n";
                    if (section.start === 0 || (section.start > 0 && originalText.charAt(section.start - 1) === '\n')) {
                        startMarkerPrefix = ""; 
                    }
                    textSegments.push(startMarkerPrefix + "%%%START_REPLACE%%%" + "\n");

                    let selectedTextSegment = originalText.substring(section.start, section.end);
                    textSegments.push(selectedTextSegment);

                    let endMarkerPrefix = "\n";
                    if (selectedTextSegment.length > 0 && selectedTextSegment.charAt(selectedTextSegment.length - 1) === '\n') {
                        endMarkerPrefix = ""; 
                    }
                    textSegments.push(endMarkerPrefix + "%%%END_REPLACE%%%" + "\n");
                    lastEnd = section.end;
                });

                textSegments.push(originalText.substring(lastEnd));
                hiddenInputArticleWithMarkers.value = textSegments.join('');
            }
            console.log("[DEBUG] Article with markers for submission (first 200 chars):", hiddenInputArticleWithMarkers.value.substring(0,200));
            
            // 5. Submit the form
            if (articleForm) {
                console.log("[DEBUG] Submitting articleForm.");
                articleForm.submit();
            }
        });
    } else {
        console.warn("[DEBUG] processArticleBtn not found for event listener.");
    }

    function renderQueuedSections() {
        queuedSectionsListUI.innerHTML = ''; 
        if (selectedSections.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No sections added yet.';
            li.style.fontStyle = 'italic';
            queuedSectionsListUI.appendChild(li);
            return;
        }

        selectedSections.forEach(section => {
            const li = document.createElement('li');
            li.innerHTML = `<span>"${escapeHTML(section.textSnippet)}" (Chars: ${section.start}-${section.end})</span>`;
            
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'Remove';
            removeBtn.classList.add('btn', 'btn-danger', 'btn-sm', 'remove-section-btn');
            removeBtn.onclick = () => {
                selectedSections = selectedSections.filter(s => s.id !== section.id);
                renderQueuedSections();
            };
            li.appendChild(removeBtn);
            queuedSectionsListUI.appendChild(li);
        });
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"/]/g, function (s) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;',
                '/': '&#x2F;'
            }[s] || s;
        });
    }

    if (typeof renderQueuedSections === 'function') renderQueuedSections(); 

    // Enhanced copy functionality that respects current view mode
    window.copyToClipboard = function() {
        let textToCopy = '';
        let copyType = '';
        
        if (currentOutputView === 'html') {
            // Copy HTML content
            const htmlContent = processedArticleHtmlPreview.innerHTML;
            if (htmlContent && htmlContent.trim() !== '' && !htmlContent.includes('Your processed article will appear here')) {
                textToCopy = htmlContent;
                copyType = 'HTML';
                
                // Create a temporary div to copy HTML content
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = htmlContent;
                document.body.appendChild(tempDiv);
                
                // Select the content
                const range = document.createRange();
                range.selectNodeContents(tempDiv);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
                
                try {
                    document.execCommand('copy');
                    selection.removeAllRanges();
                    document.body.removeChild(tempDiv);
                    
                    // Show success message
                    showCopyTooltip('HTML copied! Ready to paste into Word/Google Docs/WordPress');
                    return;
                } catch (err) {
                    document.body.removeChild(tempDiv);
                    console.error('HTML copy failed:', err);
                }
            }
        }
        
        // Fallback to markdown copy or if HTML copy failed
        const markdownContent = processedArticleDisplay.textContent || processedArticleDisplay.innerText;
        if (markdownContent && markdownContent.trim() !== '' && !markdownContent.includes('Your processed article will appear here')) {
            textToCopy = markdownContent;
            copyType = 'Markdown';
            
            navigator.clipboard.writeText(textToCopy).then(() => {
                showCopyTooltip(`${copyType} copied to clipboard!`);
            }).catch(err => {
                console.error('Copy failed:', err);
                showCopyTooltip('Copy failed. Please try again.');
            });
        } else {
            showCopyTooltip('Nothing to copy yet. Process an article first.');
        }
    };
    
    function showCopyTooltip(message) {
        const tooltip = document.getElementById('copyTooltip');
        if (tooltip) {
            tooltip.textContent = message;
            tooltip.style.visibility = 'visible';
            tooltip.style.opacity = '1';
            setTimeout(() => {
                tooltip.style.visibility = 'hidden';
                tooltip.style.opacity = '0';
            }, 2000);
        }
    }

    // Initial check for elements (these console logs should have appeared if elements were missing initially)
    const initialKeywordVariantsContainer = document.getElementById('keyword-variants-container');
    if (!initialKeywordVariantsContainer) {
        console.error("[DEBUG] INITIAL DOM SCAN: keywordVariantsContainer (id: keyword-variants-container) NOT FOUND.");
    }
    const initialAddVariantBtn = document.getElementById('addVariantBtn');
    if (!initialAddVariantBtn) {
        console.error("[DEBUG] INITIAL DOM SCAN: addVariantBtn (id: addVariantBtn) NOT FOUND.");
    }

    // --- Helper function to create and add a dynamic VARIANT input group (with priority) ---
    function addVariantInputEntry(variantText, variantPriorityStr, container, addButton) {
        if (!container || !addButton) {
            console.error("[DEBUG] addVariantInputEntry: container or addButton missing.");
            return null;
        }

        const newGroup = document.createElement('div');
        newGroup.classList.add('variant-input-group');

        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.name = 'keyword_variants_text[]';
        textInput.classList.add('keyword-variant-input-text');
        textInput.placeholder = 'Enter variant text';
        textInput.value = variantText;
        textInput.setAttribute('aria-label', 'Variant text');

        const prioritySelect = document.createElement('select');
        prioritySelect.name = 'keyword_variants_priority[]';
        prioritySelect.classList.add('keyword-variant-input-priority');
        prioritySelect.setAttribute('aria-label', 'Variant priority');
        
        const currentPriority = parseInt(variantPriorityStr, 10);
        const validPriority = (isNaN(currentPriority) || currentPriority < 1 || currentPriority > 5) ? 3 : currentPriority;

        for (let i = 1; i <= 5; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Prio ${i}${i === 1 ? ' (High)' : i === 5 ? ' (Low)' : ''}`;
            if (validPriority === i) {
                option.selected = true;
            }
            prioritySelect.appendChild(option);
        }

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.textContent = 'Remove';
        removeBtn.classList.add('btn', 'btn-danger', 'btn-sm', 'remove-variant-btn');
        removeBtn.onclick = () => { newGroup.remove(); };

        newGroup.appendChild(textInput);
        newGroup.appendChild(prioritySelect);
        newGroup.appendChild(removeBtn);
        container.insertBefore(newGroup, addButton);
        return { textInput, prioritySelect };
    }

    // Dynamic Keyword Variants Logic 
    if (initialAddVariantBtn) {
        initialAddVariantBtn.addEventListener('click', () => {
            console.log("[DEBUG] 'Add Variant' button clicked."); 
            const clickTimeKeywordVariantsContainer = document.getElementById('keyword-variants-container');
            const clickTimeAddVariantBtn = document.getElementById('addVariantBtn');

            if (!clickTimeKeywordVariantsContainer || !clickTimeAddVariantBtn) {
                console.error("[DEBUG] Could not find container or button at click time.");
                return;
            }

            // Create new variant with text input AND priority select
            addVariantInputEntry('', '3', clickTimeKeywordVariantsContainer, clickTimeAddVariantBtn);
            console.log("[DEBUG] New variant group with priority dropdown added."); 
        });
        console.log("[DEBUG] Event listener successfully attached to initialAddVariantBtn.");
    } else {
        console.error("[DEBUG] Could not attach 'Add Variant' listener because initialAddVariantBtn was not found on DOM load.");
    }

    // --- Dynamic Exclusion Keywords Logic ---
    if (addExclusionBtn && exclusionKeywordsContainer) {
        addExclusionBtn.addEventListener('click', () => {
            console.log("[DEBUG] 'Add Exclusion Keyword' button clicked.");
            const clickTimeExclusionKeywordsContainer = document.getElementById('exclusion-keywords-container');
            const clickTimeAddExclusionBtn = document.getElementById('addExclusionBtn');

            if (!clickTimeExclusionKeywordsContainer || !clickTimeAddExclusionBtn) {
                console.error("[DEBUG] Could not find exclusion container or button at click time.");
                return;
            }

            addExclusionInputEntry('', clickTimeExclusionKeywordsContainer, clickTimeAddExclusionBtn);
            console.log("[DEBUG] New exclusion keyword group added.");
        });
    } else {
        if (!addExclusionBtn) console.error("[DEBUG] addExclusionBtn not found for attaching listener.");
        if (!exclusionKeywordsContainer) console.error("[DEBUG] exclusionKeywordsContainer not found for attaching listener.");
    }

    // --- Helper function to create and add a dynamic EXCLUSION input group ---
    function addExclusionInputEntry(value, container, addButton) {
        if (!container || !addButton) {
            console.error("[DEBUG] addExclusionInputEntry: container or addButton missing.");
            return null;
        }
        const newGroup = document.createElement('div');
        newGroup.classList.add('variant-input-group', 'exclusion-input-group');
        
        const newInput = document.createElement('input');
        newInput.type = 'text';
        newInput.name = 'exclusion_keywords[]';
        newInput.classList.add('exclusion-keyword-input');
        newInput.placeholder = 'Enter another exclusion';
        newInput.value = value;
        newInput.setAttribute('aria-label', 'Exclusion keyword text');

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button'; 
        removeBtn.textContent = 'Remove';
        removeBtn.classList.add('btn', 'btn-danger', 'btn-sm', 'remove-variant-btn');
        removeBtn.onclick = () => { newGroup.remove(); };
        
        newGroup.appendChild(newInput); 
        newGroup.appendChild(removeBtn);
        container.insertBefore(newGroup, addButton);
        return newInput;
    }

    // --- Function to repopulate dynamic fields ---
    function repopulateDynamicFields() {
        // Repopulate Variants (with priority)
        if (keywordVariantsContainer && addVariantBtn) {
            const variantsDataString = keywordVariantsContainer.dataset.repopulateVariants || '';
            console.log("[DEBUG] Repopulating variants from data string:", variantsDataString);
            if (variantsDataString) {
                const variantsPairs = variantsDataString.split(',').map(v => v.trim()).filter(v => v && v.includes(':'));
                const firstVariantTextInput = keywordVariantsContainer.querySelector('.keyword-variant-input-text');
                
                variantsPairs.forEach((pair, index) => {
                    const parts = pair.split(':');
                    const text = parts[0] || '';
                    const priority = parts[1] || '3';

                    if (index === 0) {
                        // The first variant group is already in the HTML.
                        if (firstVariantTextInput && firstVariantTextInput.value === '' && text !== '') {
                            firstVariantTextInput.value = text;
                            const firstPrioritySelect = keywordVariantsContainer.querySelector('.keyword-variant-input-priority');
                            if (firstPrioritySelect) firstPrioritySelect.value = priority;
                            console.log(`[DEBUG] JS populated first existing variant group with: ${text}:${priority}`);
                        }
                    } else {
                        // For all subsequent items, add a new group.
                        console.log(`[DEBUG] Adding new variant group via JS for: ${text}:${priority}`);
                        addVariantInputEntry(text, priority, keywordVariantsContainer, addVariantBtn);
                    }
                });
            }
        }

        // Repopulate Exclusions
        if (exclusionKeywordsContainer && addExclusionBtn) {
            const exclusionsString = exclusionKeywordsContainer.dataset.repopulateExclusions || '';
            console.log("[DEBUG] Repopulating exclusions from data string:", exclusionsString);
            if (exclusionsString) {
                const exclusionsArray = exclusionsString.split(',').map(e => e.trim()).filter(e => e);
                const firstExclusionInput = exclusionKeywordsContainer.querySelector('.exclusion-keyword-input');

                exclusionsArray.forEach((exclusionText, index) => {
                    if (index === 0) {
                        if (firstExclusionInput && firstExclusionInput.value === '' && exclusionText !== '') {
                            firstExclusionInput.value = exclusionText;
                            console.log(`[DEBUG] JS populated first existing exclusion input with: ${exclusionText}`);
                        }
                    } else {
                        console.log(`[DEBUG] Adding new exclusion group via JS for: ${exclusionText}`);
                        addExclusionInputEntry(exclusionText, exclusionKeywordsContainer, addExclusionBtn);
                    }
                });
            }
        }
    }

    // --- Demo Data Loading - UPDATED TO MATCH PYTHON FLASK APP ---
    if (loadDemoDataBtn) {
        loadDemoDataBtn.addEventListener('click', () => {
            console.log("[DEBUG] Load Demo Data button clicked.");
            
            // Demo article content - EXACT MATCH from Python Flask app
            const demoArticle = `# Vigor Now Review 2025: Updated In-Depth Analysis Before You Buy!

Addressing men's health and vitality has never been more important, especially as modern lifestyles, stress, and aging take a toll on energy levels and sexual performance.

| Specification        | Details                                                |
|----------------------|--------------------------------------------------------|
| **Product Name**     | Vigor Now                                             |
| **Category**         | Male Enhancement Supplement                           |
| **Form**             | Capsules                                              |
| **Serving Size**     | 2 capsules daily                                      |

## What is Vigor Now?

Vigor Now is a dietary supplement formulated to enhance male sexual performance, stamina, and overall vitality. The product claims to use natural ingredients to support testosterone levels, improve blood flow, and boost energy.

## How Does Vigor Now Work?

Vigor Now works by leveraging a synergistic blend of herbal extracts and amino acids to support key aspects of male sexual health.

## Our Review Process

Our evaluation of Vigor Now involved a comprehensive review process, including ingredient analysis, customer feedback examination, and comparison with similar products in the market.

## Ingredient Quality and Sourcing

Vigor Now's formula is anchored by clinically studied, high-quality ingredients sourced for purity and potency.

## Final Verdict

Vigor Now provides a comprehensive solution for men seeking to enhance their sexual health and overall vitality.

## Overall Assessment

Vigor Now stands out for its natural, research-backed formula and high customer satisfaction. However, individual results may vary, and it's important to maintain realistic expectations.

## Customer Testimonials

The reputation of Vigor Now is built on a foundation of positive customer experiences and transparent business practices.

### Real User Reviews from Various Platforms

**Source: Reddit (www.reddit.com)**
> "I was skeptical at first, but after using Vigor Now for a month, I noticed significant improvements in my energy levels and performance. Highly recommend!"

**Source: Trustpilot (www.trustpilot.com)**
> "Vigor Now reviews were spot on. My performance has improved, and I feel more confident overall."

**Source: Quora (www.quora.com)**
> "I've tried several male enhancement supplements, but Vigor Now stands out for its natural approach and effectiveness."

**Source: Facebook (www.facebook.com)**
> "I bought Vigor Now after reading a detailed Vigor Now review online. The results have been impressive!"

**Source: X (formerly Twitter)**
> "Wasn't sure if Vigor Now was a scam, but it's definitely legit. The energy boost is real!"

**Source: Reddit (www.reddit.com)**
> "I've struggled with low energy for years. Vigor Now has helped me regain my vitality and confidence."

**Source: Trustpilot (www.trustpilot.com)**
> "I appreciate the honest Vigor Now reviews online. The supplement delivers on its promises."`;

            // Clear existing content and load demo data
            if (articleTextarea) {
                articleTextarea.value = demoArticle;
                autoResizeTextarea(articleTextarea);
            }
            
            // Set demo main keyword - EXACT MATCH from Python Flask app
            if (mainKeywordInput) {
                mainKeywordInput.value = 'Vigor Now';
            }
            
            // Set demo replacement percentage - EXACT MATCH from Python Flask app
            if (replacementPercentageInput) {
                replacementPercentageInput.value = '50';
            }
            
            // Set demo settings (keep defaults) - EXACT MATCH from Python Flask app
            if (skipHeadersInput) skipHeadersInput.checked = true;
            if (skipTablesInput) skipTablesInput.checked = true;
            if (sectionTailModeInput) sectionTailModeInput.checked = false;
            if (tailSkipAmountInput) tailSkipAmountInput.value = 'percent:50';
            if (tailSettingsDiv) tailSettingsDiv.classList.add('is-hidden');
            
            // Clear existing variants and set demo variants - EXACT MATCH from Python Flask app
            const existingVariantGroups = keywordVariantsContainer.querySelectorAll('.variant-input-group');
            existingVariantGroups.forEach((group, index) => {
                if (index > 0) { // Keep the first one, remove others
                    group.remove();
                }
            });
            
            // Set first variant - EXACT MATCH from Python Flask app
            const firstVariantText = keywordVariantsContainer.querySelector('.keyword-variant-input-text');
            const firstVariantPriority = keywordVariantsContainer.querySelector('.keyword-variant-input-priority');
            if (firstVariantText) firstVariantText.value = 'VigorNow';
            if (firstVariantPriority) firstVariantPriority.value = '1';
            
            // Add additional demo variants - EXACT MATCH from Python Flask app
            if (addVariantBtn && keywordVariantsContainer) {
                addVariantInputEntry('VigorNow Male Enhancement', '2', keywordVariantsContainer, addVariantBtn);
                addVariantInputEntry('VigorNow ME', '3', keywordVariantsContainer, addVariantBtn);
            }
            
            // Clear existing exclusions and set demo exclusion - EXACT MATCH from Python Flask app
            const existingExclusionGroups = exclusionKeywordsContainer.querySelectorAll('.exclusion-input-group');
            existingExclusionGroups.forEach((group, index) => {
                if (index > 0) { // Keep the first one, remove others
                    group.remove();
                }
            });
            
            // Set first exclusion - EXACT MATCH from Python Flask app
            const firstExclusionInput = exclusionKeywordsContainer.querySelector('.exclusion-keyword-input');
            if (firstExclusionInput) firstExclusionInput.value = 'Vigor Now is';
            
            // Clear any selected sections
            selectedSections = [];
            renderQueuedSections();
            
            console.log("[DEBUG] Demo data loaded successfully!");
            alert('✅ Demo data loaded! You can now click "Process Article" to see the priority-based replacement in action.\n\n📊 Priority Distribution:\n• Priority 1 (VigorNow): 50% of replacements\n• Priority 2 (VigorNow Male Enhancement): 25%\n• Priority 3 (VigorNow ME): 15%');
        });
    } else {
        console.warn("[DEBUG] loadDemoDataBtn not found for event listener.");
    }

    // Call repopulation on DOM load
    repopulateDynamicFields();
});
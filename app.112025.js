// Recipe Manager Pro - JavaScript
class RecipeManager {
    constructor() {
        this.recipes = [];
        this.currentRecipeId = 1;
        this.pendingImportRecipes = [];
        this.measurementUnits = {
            volume: {
                cup: 1,
                tablespoon: 16,
                teaspoon: 48,
                fluid_ounce: 8,
                pint: 0.5,
                quart: 0.25,
                gallon: 0.0625,
                liter: 1.057,
                milliliter: 1057.0
            },
            weight: {
                pound: 1,
                ounce: 16,
                gram: 453.592,
                kilogram: 0.453592
            },
            count: {
                piece: 1,
                item: 1,
                whole: 1,
                clove: 1,
                slice: 1,
                pinch: 1
            }
        };

        this.courseTypes = ["Breakfast", "Lunch", "Dinner", "Snack", "Dessert", "Appetizer", "Side Dish", "Beverage", "Marinade", "Sauce", "Spices"];
        this.categoryTypes = ["Chicken", "Beef", "Pork", "Fish", "Vegetarian", "Pasta", "Soup", "Salad", "Pizza", "Sandwich", "Casserole"];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTabs();
        this.loadRecipesFromServer();
    }

    loadRecipesFromServer() {
        fetch('load_recipes.php')
            .then(res => res.json())
            .then(data => {
                this.recipes = Array.isArray(data) ? data : [];
                if (this.recipes.length > 0) {
                    const maxId = Math.max(...this.recipes.map(r => r.id || 0));
                    this.currentRecipeId = maxId + 1;
                }
                this.renderRecipes();
                this.updateRecipeCount();
                this.populateFilters();
            })
            .catch(() => {
                this.recipes = [];
                this.renderRecipes();
                this.updateRecipeCount();
                this.populateFilters();
            });
    }

    saveRecipesToServer() {
        fetch('save_recipes.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.recipes)
        });
    }

    setupEventListeners() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        document.querySelectorAll('.add-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchAddTab(e.target.dataset.addTab));
        });

        document.getElementById('searchInput').addEventListener('input', (e) => this.filterRecipes());
        document.getElementById('courseFilter').addEventListener('change', (e) => this.filterRecipes());
        document.getElementById('categoryFilter').addEventListener('change', (e) => this.filterRecipes());
        document.getElementById('sortBy').addEventListener('change', (e) => this.filterRecipes());

        document.getElementById('manualRecipeForm').addEventListener('submit', (e) => this.saveManualRecipe(e));
        document.getElementById('addIngredient').addEventListener('click', () => this.addIngredientRow());

        document.getElementById('scrapeUrl').addEventListener('click', () => this.scrapeRecipeFromUrl());

        const fileUploadArea = document.getElementById('fileUploadArea');
        const fileInput = document.getElementById('fileInput');
        
        fileUploadArea.addEventListener('click', () => fileInput.click());
        fileUploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        fileUploadArea.addEventListener('drop', (e) => this.handleFileDrop(e));
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        document.getElementById('confirmImport').addEventListener('click', () => this.confirmImport());
        document.getElementById('cancelImport').addEventListener('click', () => this.cancelImport());

        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });

        document.getElementById('editRecipeBtn').addEventListener('click', () => {
            const recipeId = parseInt(document.getElementById('modalRecipeTitle').dataset.recipeId);
            this.editRecipe(recipeId);
        });
        document.getElementById('printRecipeBtn').addEventListener('click', () => window.print());

        document.getElementById('decreaseServings').addEventListener('click', () => this.adjustServings(-1));
        document.getElementById('increaseServings').addEventListener('click', () => this.adjustServings(1));
        document.getElementById('currentServings').addEventListener('input', (e) => this.setServings(parseInt(e.target.value)));

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal();
            });
        });
    }

    setupTabs() {
        this.switchTab('library');
        this.switchAddTab('manual');
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(tabName).classList.add('active');
    }

    switchAddTab(tabName) {
        document.querySelectorAll('.add-tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.add-tab-content').forEach(content => content.classList.remove('active'));
        
        document.querySelector(`[data-add-tab="${tabName}"]`).classList.add('active');
        document.getElementById(tabName).classList.add('active');
    }

    addIngredientRow() {
        const ingredientsList = document.getElementById('ingredientsList');
        const newRow = document.createElement('div');
        newRow.className = 'ingredient-row';
        newRow.innerHTML = `
            <input type="number" class="form-control ingredient-quantity" placeholder="Qty" step="0.25" required>
            <select class="form-control ingredient-unit">
                <option value="cup">cup</option>
                <option value="tablespoon">tablespoon</option>
                <option value="teaspoon">teaspoon</option>
                <option value="ounce">ounce</option>
                <option value="pound">pound</option>
                <option value="gram">gram</option>
                <option value="piece">piece</option>
                <option value="clove">clove</option>
                <option value="slice">slice</option>
            </select>
            <input type="text" class="form-control ingredient-name" placeholder="Ingredient name" required>
            <button type="button" class="btn btn--secondary remove-ingredient">Remove</button>
        `;
        
        newRow.querySelector('.remove-ingredient').addEventListener('click', () => newRow.remove());
        ingredientsList.appendChild(newRow);
    }

    saveManualRecipe(e) {
        e.preventDefault();
        
        const ingredientRows = document.querySelectorAll('#ingredientsList .ingredient-row');
        const ingredients = [];
        
        ingredientRows.forEach(row => {
            const quantity = parseFloat(row.querySelector('.ingredient-quantity').value);
            const unit = row.querySelector('.ingredient-unit').value;
            const ingredient = row.querySelector('.ingredient-name').value.trim();
            
            if (quantity && ingredient) {
                ingredients.push({ quantity, unit, ingredient });
            }
        });

        const recipe = {
            id: this.currentRecipeId++,
            title: document.getElementById('recipeTitle').value.trim(),
            course: document.getElementById('recipeCourse').value,
            category: document.getElementById('recipeCategory').value.trim(),
            collections: [],
            source: "",
            servings: parseInt(document.getElementById('recipeServings').value),
            prepTime: document.getElementById('recipePrepTime').value.trim() || "Not specified",
            cookTime: document.getElementById('recipeCookTime').value.trim() || "Not specified",
            ingredients: ingredients,
            instructions: document.getElementById('recipeInstructions').value.trim().split('\n').filter(line => line.trim()),
            notes: document.getElementById('recipeNotes').value.trim(),
            nutrition: {},
            images: []
        };

        this.recipes.push(recipe);
        this.saveRecipesToServer();
        this.renderRecipes();
        this.updateRecipeCount();
        this.populateFilters();
        
        e.target.reset();
        document.getElementById('ingredientsList').innerHTML = `
            <div class="ingredient-row">
                <input type="number" class="form-control ingredient-quantity" placeholder="Qty" step="0.25" required>
                <select class="form-control ingredient-unit">
                    <option value="cup">cup</option>
                    <option value="tablespoon">tablespoon</option>
                    <option value="teaspoon">teaspoon</option>
                    <option value="ounce">ounce</option>
                    <option value="pound">pound</option>
                    <option value="gram">gram</option>
                    <option value="piece">piece</option>
                    <option value="clove">clove</option>
                    <option value="slice">slice</option>
                </select>
                <input type="text" class="form-control ingredient-name" placeholder="Ingredient name" required>
                <button type="button" class="btn btn--secondary remove-ingredient">Remove</button>
            </div>
        `;
        
        document.querySelector('.remove-ingredient').addEventListener('click', (e) => e.target.closest('.ingredient-row').remove());
        
        this.showStatus("Recipe saved successfully!", 'success');
        this.switchTab('library');
    }

    scrapeRecipeFromUrl() {
        const url = document.getElementById('recipeUrl').value.trim();
        const statusEl = document.getElementById('urlStatus');
        
        if (!url) {
            this.showStatus('Please enter a URL', 'error', statusEl);
            return;
        }

        this.showStatus('Extracting recipe data...', 'info', statusEl);
        
        setTimeout(() => {
            const mockRecipe = {
                id: this.currentRecipeId++,
                title: "Scraped Recipe from URL",
                course: "Dinner",
                category: "Main Course",
                collections: ["URL Import"],
                source: url,
                servings: 4,
                prepTime: "20 minutes",
                cookTime: "30 minutes",
                ingredients: [
                    {quantity: 2, unit: "cup", ingredient: "sample ingredient"},
                    {quantity: 1, unit: "tablespoon", ingredient: "sample spice"},
                    {quantity: 1, unit: "pound", ingredient: "sample protein"}
                ],
                instructions: [
                    "This is a mock recipe scraped from the URL.",
                    "In a real implementation, this would parse the webpage.",
                    "It would look for JSON-LD structured data or other recipe formats.",
                    "For now, this demonstrates the functionality."
                ],
                notes: "This recipe was imported from: " + url,
                nutrition: {},
                images: []
            };
            
            this.recipes.push(mockRecipe);
            this.saveRecipesToServer();
            this.renderRecipes();
            this.updateRecipeCount();
            this.populateFilters();
            
            this.showStatus('Recipe imported successfully!', 'success', statusEl);
            document.getElementById('recipeUrl').value = '';
            
            setTimeout(() => this.switchTab('library'), 1500);
        }, 2000);
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }

    handleFileDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processRecipeFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            this.processRecipeFile(files[0]);
        }
    }

    processRecipeFile(file) {
        const statusEl = document.getElementById('fileStatus');
        const fileName = file.name.toLowerCase();
        
        if (!fileName.endsWith('.txt') && !fileName.endsWith('.html') && !fileName.endsWith('.htm')) {
            this.showStatus('Please select a .txt or .html file', 'error', statusEl);
            return;
        }

        this.showProgress(true);
        this.updateProgress(25, 'Reading file...');

        const reader = new FileReader();
        reader.onload = (e) => {
            setTimeout(() => {
                try {
                    let recipes;
                    if (fileName.endsWith('.html') || fileName.endsWith('.htm')) {
                        this.updateProgress(50, 'Parsing HTML format...');
                        recipes = this.parseRecipeManagerHTML(e.target.result);
                    } else {
                        this.updateProgress(50, 'Parsing text format...');
                        recipes = this.parseRecipeManagerFile(e.target.result);
                    }
                    
                    this.updateProgress(75, 'Processing recipes...');
                    
                    recipes.forEach(recipe => {
                        recipe.id = this.currentRecipeId++;
                    });
                    
                    this.pendingImportRecipes = recipes;
                    this.updateProgress(100, 'Complete!');
                    
                    setTimeout(() => {
                        this.showProgress(false);
                        this.showImportPreview(recipes);
                        this.showStatus(`Found ${recipes.length} recipe(s) ready to import`, 'success', statusEl);
                    }, 500);
                    
                } catch (error) {
                    this.showProgress(false);
                    this.showStatus('Error parsing file: ' + error.message, 'error', statusEl);
                }
            }, 500);
        };
        
        reader.readAsText(file);
    }

    parseRecipeManagerHTML(htmlContent) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const recipeElements = doc.querySelectorAll('.recipe-details');
        const recipes = [];
        
        recipeElements.forEach(recipeEl => {
            try {
                const recipe = {
                    title: this.extractTitle(recipeEl),
                    course: this.extractCourse(recipeEl),
                    category: this.extractCategory(recipeEl),
                    collections: [],
                    source: this.extractSource(recipeEl),
                    servings: this.extractYield(recipeEl),
                    prepTime: this.extractPrepTime(recipeEl),
                    cookTime: this.extractCookTime(recipeEl),
                    ingredients: this.extractIngredients(recipeEl),
                    instructions: this.extractDirections(recipeEl),
                    notes: this.extractNotes(recipeEl),
                    nutrition: this.extractNutrition(recipeEl),
                    images: this.extractImages(recipeEl)
                };
                
                if (recipe.title && recipe.ingredients.length > 0) {
                    recipes.push(recipe);
                }
            } catch (error) {
                console.warn('Error parsing recipe:', error);
            }
        });
        
        return recipes;
    }

    extractTitle(recipeEl) {
        const titleEl = recipeEl.querySelector('h2[itemprop="name"]');
        return titleEl ? titleEl.textContent.trim() : "Untitled Recipe";
    }

    extractCourse(recipeEl) {
        const courseEl = recipeEl.querySelector('span[itemprop="recipeCourse"]');
        return courseEl ? courseEl.textContent.trim() : "Dinner";
    }

    extractCategory(recipeEl) {
        const categoryEl = recipeEl.querySelector('meta[itemprop="recipeCategory"]');
        return categoryEl ? categoryEl.getAttribute('content') || categoryEl.textContent.trim() : "Main Course";
    }

    extractSource(recipeEl) {
        const sourceEl = recipeEl.querySelector('a[itemprop="recipeSource"]');
        return sourceEl ? sourceEl.href : "";
    }

    extractYield(recipeEl) {
        const yieldEl = recipeEl.querySelector('span[itemprop="recipeYield"]');
        if (yieldEl) {
            const yieldText = yieldEl.textContent.trim();
            const match = yieldText.match(/\d+/);
            return match ? parseInt(match[0]) : 4;
        }
        return 4;
    }

    extractPrepTime(recipeEl) {
        const prepTimeEl = recipeEl.querySelector('meta[itemprop="prepTime"]');
        if (prepTimeEl) {
            const timeValue = prepTimeEl.getAttribute('content') || prepTimeEl.textContent;
            return this.parseISO8601Duration(timeValue);
        }
        return "Not specified";
    }

    extractCookTime(recipeEl) {
        const cookTimeEl = recipeEl.querySelector('meta[itemprop="cookTime"]');
        if (cookTimeEl) {
            const timeValue = cookTimeEl.getAttribute('content') || cookTimeEl.textContent;
            return this.parseISO8601Duration(timeValue);
        }
        return "Not specified";
    }

    extractIngredients(recipeEl) {
        const ingredients = [];
        const ingredientsContainer = recipeEl.querySelector('.recipe-ingredients[itemprop="recipeIngredients"]');
        
        if (ingredientsContainer) {
            const ingredientElements = ingredientsContainer.querySelectorAll('p');
            ingredientElements.forEach(el => {
                const text = el.textContent.trim();
                if (text) {
                    const parsed = this.parseIngredientText(text);
                    if (parsed) {
                        ingredients.push(parsed);
                    }
                }
            });
        }
        
        return ingredients;
    }

    extractDirections(recipeEl) {
        const directionsEl = recipeEl.querySelector('[itemprop="recipeDirections"]');
        if (directionsEl) {
            const text = directionsEl.textContent.trim();
            return text.split(/\d+\./).filter(step => step.trim()).map(step => step.trim());
        }
        return ["No instructions provided"];
    }

    extractNotes(recipeEl) {
        const notesEl = recipeEl.querySelector('.recipe-notes[itemprop="recipeNotes"]');
        return notesEl ? notesEl.textContent.trim() : "";
    }

    extractNutrition(recipeEl) {
        const nutrition = {};
        const nutritionMap = {
            'recipeNutCalories': 'calories',
            'recipeNutProtein': 'protein',
            'recipeNutTotalFat': 'totalFat',
            'recipeNutSaturatedFat': 'saturatedFat',
            'recipeNutCholesterol': 'cholesterol',
            'recipeNutSodium': 'sodium',
            'recipeNutTotalCarbohydrate': 'totalCarbs',
            'recipeNutDietaryFiber': 'dietaryFiber',
            'recipeNutSugars': 'sugars'
        };

        Object.entries(nutritionMap).forEach(([itemprop, key]) => {
            const el = recipeEl.querySelector(`meta[itemprop="${itemprop}"]`);
            if (el) {
                const value = el.getAttribute('content') || el.textContent;
                if (key === 'calories') {
                    nutrition[key] = parseInt(value) || 0;
                } else {
                    nutrition[key] = value.trim();
                }
            }
        });

        return nutrition;
    }

    extractImages(recipeEl) {
        const images = [];
        
        const mainPhoto = recipeEl.querySelector('img.recipe-photo');
        if (mainPhoto && mainPhoto.src) {
            images.push(mainPhoto.src);
        }
        
        const additionalPhotos = recipeEl.querySelectorAll('.recipe-photos-div img');
        additionalPhotos.forEach(img => {
            if (img.src && !images.includes(img.src)) {
                images.push(img.src);
            }
        });
        
        return images;
    }

    parseISO8601Duration(duration) {
        if (!duration || typeof duration !== 'string') return "Not specified";
        
        const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
        if (match) {
            const hours = parseInt(match[1]) || 0;
            const minutes = parseInt(match[2]) || 0;
            
            if (hours && minutes) {
                return `${hours}h ${minutes}m`;
            } else if (hours) {
                return `${hours}h`;
            } else if (minutes) {
                return `${minutes}m`;
            }
        }
        
        return duration;
    }

    formatTime(isoTime) {
        // Handle PT0S or missing times
        if (!isoTime || isoTime === 'PT0S' || isoTime === 'PT0M' || isoTime === '') {
            return 'Not specified';
        }

        // Parse ISO 8601 duration format (PT15M, PT1H30M, etc.)
        const match = isoTime.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) return isoTime;

        const hours = match[1] ? parseInt(match[1]) : 0;
        const minutes = match[2] ? parseInt(match[2]) : 0;
        const seconds = match[3] ? parseInt(match[3]) : 0;

        const parts = [];
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (seconds > 0 && hours === 0) parts.push(`${seconds}s`);

        return parts.length > 0 ? parts.join(' ') : 'Not specified';
    }    

    parseIngredientText(text) {
        const match = text.match(/^(\d+(?:\/\d+)?(?:\.\d+)?)\s+(\w+)\s+(.+)$/);
        if (match) {
            const [, quantity, unit, ingredient] = match;
            return {
                quantity: this.parseQuantity(quantity),
                unit: unit.toLowerCase(),
                ingredient: ingredient
            };
        }
        
        return {
            quantity: 1,
            unit: "piece",
            ingredient: text
        };
    }

    parseRecipeManagerFile(content) {
        const recipes = [];
        const recipeBlocks = content.split(/\n\s*\n\s*\n/).filter(block => block.trim());
        
        recipeBlocks.forEach(block => {
            const lines = block.split('\n').map(line => line.trim()).filter(line => line);
            if (lines.length < 4) return;
            
            const title = lines[0];
            const categories = lines[1].split(',').map(cat => cat.trim())[0] || "Uncategorized";
            
            const ingredients = [];
            const instructions = [];
            let parsingIngredients = true;
            let servings = 4;
            let prepTime = "Not specified";
            let cookTime = "Not specified";
            
            for (let i = 2; i < lines.length; i++) {
                const line = lines[i];
                
                if (line.toLowerCase().includes('yield:')) {
                    const match = line.match(/yield:\s*(\d+)/i);
                    if (match) servings = parseInt(match[1]);
                    continue;
                }
                
                if (line.toLowerCase().includes('preparation time:')) {
                    prepTime = line.split(':')[1].trim();
                    continue;
                }
                
                const ingredientMatch = line.match(/^(\d+(?:\/\d+)?(?:\.\d+)?)\s+(\w+)\s+(.+)$/);
                if (ingredientMatch && parsingIngredients) {
                    const [, quantity, unit, ingredient] = ingredientMatch;
                    ingredients.push({
                        quantity: this.parseQuantity(quantity),
                        unit: unit.toLowerCase(),
                        ingredient: ingredient
                    });
                } else {
                    parsingIngredients = false;
                    if (line.length > 10) {
                        instructions.push(line);
                    }
                }
            }
            
            if (title && ingredients.length > 0) {
                recipes.push({
                    title,
                    course: "Dinner",
                    category: categories,
                    collections: [],
                    source: "",
                    servings,
                    prepTime,
                    cookTime,
                    ingredients,
                    instructions: instructions.length > 0 ? instructions : ["No instructions provided"],
                    notes: "",
                    nutrition: {},
                    images: []
                });
            }
        });
        
        return recipes;
    }

    parseQuantity(quantityStr) {
        if (quantityStr.includes('/')) {
            const parts = quantityStr.split(' ');
            let result = 0;
            
            parts.forEach(part => {
                if (part.includes('/')) {
                    const [num, den] = part.split('/').map(n => parseInt(n));
                    result += num / den;
                } else {
                    result += parseInt(part) || 0;
                }
            });
            
            return result;
        }
        
        return parseFloat(quantityStr) || 0;
    }

    showProgress(show) {
        const progressEl = document.getElementById('importProgress');
        if (show) {
            progressEl.classList.remove('hidden');
        } else {
            progressEl.classList.add('hidden');
        }
    }

    updateProgress(percent, text) {
        document.getElementById('progressFill').style.width = `${percent}%`;
        document.getElementById('progressText').textContent = text;
    }

    showImportPreview(recipes) {
        const previewEl = document.getElementById('importPreview');
        const contentEl = document.getElementById('previewContent');
        
        contentEl.innerHTML = recipes.map(recipe => `
            <div class="preview-recipe">
                <h5>${recipe.title}</h5>
                <div class="preview-recipe-meta">
                    ${recipe.course} • ${recipe.category} • ${recipe.servings} servings • ${recipe.ingredients.length} ingredients
                    ${recipe.nutrition.calories ? `• ${recipe.nutrition.calories} cal` : ''}
                </div>
            </div>
        `).join('');
        
        previewEl.classList.remove('hidden');
    }

    confirmImport() {
        this.recipes.push(...this.pendingImportRecipes);
        this.saveRecipesToServer();
        this.renderRecipes();
        this.updateRecipeCount();
        this.populateFilters();
        
        const count = this.pendingImportRecipes.length;
        this.pendingImportRecipes = [];
        document.getElementById('importPreview').classList.add('hidden');
        
        this.showStatus(`Successfully imported ${count} recipe(s)!`, 'success');
        setTimeout(() => this.switchTab('library'), 1500);
    }

    cancelImport() {
        this.pendingImportRecipes = [];
        document.getElementById('importPreview').classList.add('hidden');
        this.showStatus('Import cancelled', 'info');
    }

    renderRecipes() {
        const grid = document.getElementById('recipeGrid');
        const filteredRecipes = this.getFilteredRecipes();
        
        if (filteredRecipes.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                        </svg>
                    </div>
                    <h3>No recipes found</h3>
                    <p>Try adjusting your search or filters, or add a new recipe!</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = filteredRecipes.map(recipe => `
            <div class="recipe-card" onclick="recipeManager.openRecipeModal(${recipe.id})">
                <div class="recipe-card-header">
                    <h3 class="recipe-card-title">${recipe.title}</h3>
                    <div class="recipe-card-tags">
                        <span class="recipe-tag recipe-tag--course">${recipe.course}</span>
                        <span class="recipe-tag recipe-tag--category">${recipe.category}</span>
                    </div>
                </div>
                <div class="recipe-card-meta">
                    <span>🍽️ ${recipe.servings} servings</span>
                    ${recipe.prepTime && recipe.prepTime !== 'PT0S' ? `<span>⏱️ ${this.formatTime(recipe.prepTime)}</span>` : ''}
                    ${recipe.cookTime && recipe.cookTime !== 'PT0S' ? `<span>🔥 ${this.formatTime(recipe.cookTime)}</span>` : ''}
                    ${recipe.nutrition.calories ? `<span>📊 ${recipe.nutrition.calories} cal</span>` : ''}
                </div>
                ${recipe.nutrition.calories ? `
                    <div class="recipe-card-nutrition">
                        ${recipe.nutrition.calories} cal • ${recipe.nutrition.protein || '0g'} protein • ${recipe.nutrition.totalCarbs || '0g'} carbs
                    </div>
                ` : ''}
                <div class="recipe-card-actions" onclick="event.stopPropagation()">
                    <button class="btn btn--primary" onclick="recipeManager.openRecipeModal(${recipe.id})">View</button>
                    <button class="btn btn--secondary" onclick="recipeManager.deleteRecipe(${recipe.id})">Delete</button>
                </div>
            </div>
        `).join('');
    }

    getFilteredRecipes() {
        let filtered = [...this.recipes];
        
        const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
        if (searchTerm) {
            filtered = filtered.filter(recipe => 
                recipe.title.toLowerCase().includes(searchTerm) ||
                recipe.course.toLowerCase().includes(searchTerm) ||
                recipe.category.toLowerCase().includes(searchTerm) ||
                recipe.ingredients.some(ing => ing.ingredient.toLowerCase().includes(searchTerm)) ||
                recipe.collections.some(col => col.toLowerCase().includes(searchTerm))
            );
        }
        
        const courseFilter = document.getElementById('courseFilter').value;
        if (courseFilter && courseFilter !== "") {
            filtered = filtered.filter(recipe => recipe.course === courseFilter);
        }
        
        const categoryFilter = document.getElementById('categoryFilter').value;
        if (categoryFilter && categoryFilter !== "") {
            filtered = filtered.filter(recipe => recipe.category === categoryFilter);
        }
        
        const sortBy = document.getElementById('sortBy').value;
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.title.localeCompare(b.title);
                case 'category':
                    return a.category.localeCompare(b.category);
                case 'course':
                    return a.course.localeCompare(b.course);
                case 'servings':
                    return a.servings - b.servings;
                default:
                    return 0;
            }
        });
        
        return filtered;
    }

    filterRecipes() {
        this.renderRecipes();
        this.updateRecipeCount();
    }

    updateRecipeCount() {
        const count = this.getFilteredRecipes().length;
        document.getElementById('recipeCount').textContent = count;
    }

    populateFilters() {
        const courses = [...new Set(this.recipes.map(recipe => recipe.course))].sort();
        const courseFilter = document.getElementById('courseFilter');
        const currentCourse = courseFilter.value;
        
        courseFilter.innerHTML = '<option value="">All Courses</option>' +
            courses.map(course => `<option value="${course}">${course}</option>`).join('');
        
        if (courses.includes(currentCourse)) {
            courseFilter.value = currentCourse;
        }

        const categories = [...new Set(this.recipes.map(recipe => recipe.category))].sort();
        const categoryFilter = document.getElementById('categoryFilter');
        const currentCategory = categoryFilter.value;
        
        categoryFilter.innerHTML = '<option value="">All Categories</option>' +
            categories.map(category => `<option value="${category}">${category}</option>`).join('');
        
        if (categories.includes(currentCategory)) {
            categoryFilter.value = currentCategory;
        }
    }

    openRecipeModal(recipeId) {
        const recipe = this.recipes.find(r => r.id === recipeId);
        if (!recipe) return;

        this.currentRecipe = recipe;
        this.currentScaledServings = recipe.servings;
        
        document.getElementById('modalRecipeTitle').textContent = recipe.title;
        document.getElementById('modalRecipeTitle').dataset.recipeId = recipe.id;
        
        const tagsEl = document.getElementById('modalRecipeTags');
        tagsEl.innerHTML = `
            <span class="recipe-tag recipe-tag--course">${recipe.course}</span>
            <span class="recipe-tag recipe-tag--category">${recipe.category}</span>
            ${recipe.collections.map(col => `<span class="recipe-tag">${col}</span>`).join('')}
        `;
        
        document.getElementById('modalRecipeCourse').textContent = recipe.course;
        document.getElementById('modalRecipeCategory').textContent = recipe.category;
        document.getElementById('modalRecipePrepTime').textContent = this.formatTime(recipe.prepTime);
        document.getElementById('modalRecipeCookTime').textContent = this.formatTime(recipe.cookTime);
        
        const sourceSection = document.getElementById('modalSourceSection');
        const sourceLink = document.getElementById('modalRecipeSource');
        if (recipe.source) {
            sourceLink.textContent = recipe.source;
            sourceLink.href = recipe.source;
            sourceSection.style.display = 'block';
        } else {
            sourceSection.style.display = 'none';
        }
        
        this.updateNutritionDisplay(recipe.nutrition);
        
        document.getElementById('originalServings').textContent = recipe.servings;
        document.getElementById('currentServings').value = recipe.servings;
        
        this.updateScaledIngredients();
        this.renderInstructions(recipe.instructions);
        
        if (recipe.notes) {
            document.getElementById('modalRecipeNotes').textContent = recipe.notes;
            document.getElementById('modalNotesSection').style.display = 'block';
        } else {
            document.getElementById('modalNotesSection').style.display = 'none';
        }
        
        this.updateImageGallery(recipe.images);
        
        document.getElementById('recipeModal').classList.remove('hidden');
    }

    editRecipe(recipeId) {
    const recipe = this.recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    // Close the view modal
    document.getElementById('recipeModal').classList.add('hidden');

    // Populate the edit form
    const form = document.getElementById('editRecipeForm');

    // Create form HTML with current recipe data
    form.innerHTML = `
        <input type="hidden" id="editRecipeId" value="${recipe.id}">

        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Recipe Title</label>
                <input type="text" id="editRecipeTitle" class="form-control" value="${recipe.title}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Course</label>
                <select id="editRecipeCourse" class="form-control">
                    ${this.courseTypes.map(course => 
                        `<option value="${course}" ${recipe.course === course ? 'selected' : ''}>${course}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Category</label>
                <input type="text" id="editRecipeCategory" class="form-control" value="${recipe.category}" required>
            </div>
        </div>

        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Servings</label>
                <input type="number" id="editRecipeServings" class="form-control" min="1" value="${recipe.servings}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Prep Time</label>
                <input type="text" id="editRecipePrepTime" class="form-control" placeholder="e.g. 15 minutes" value="${this.formatTime(recipe.prepTime)}">
            </div>
            <div class="form-group">
                <label class="form-label">Cook Time</label>
                <input type="text" id="editRecipeCookTime" class="form-control" placeholder="e.g. 30 minutes" value="${this.formatTime(recipe.cookTime)}">
            </div>
        </div>

        <div class="form-group">
            <label class="form-label">Ingredients</label>
            <div id="editIngredientsList" class="ingredients-list">
                ${recipe.ingredients.map((ing, index) => `
                    <div class="ingredient-row" data-index="${index}">
                        <input type="number" class="form-control ingredient-quantity" placeholder="Qty" step="0.25" value="${ing.quantity}" required>
                        <input type="text" class="form-control ingredient-unit" value="${ing.unit}" required>
                        <input type="text" class="form-control ingredient-name" placeholder="Ingredient name" value="${ing.ingredient}" required>
                        <button type="button" class="btn btn--secondary remove-ingredient" onclick="this.parentElement.remove()">Remove</button>
                    </div>
                `).join('')}
            </div>
            <button type="button" id="editAddIngredient" class="btn btn--secondary">Add Ingredient</button>
        </div>

        <div class="form-group">
            <label class="form-label">Instructions</label>
            <textarea id="editRecipeInstructions" class="form-control" rows="6" required>${recipe.instructions.join('\n\n')}</textarea>
        </div>

        <div class="form-group">
            <label class="form-label">Notes (optional)</label>
            <textarea id="editRecipeNotes" class="form-control" rows="3">${recipe.notes || ''}</textarea>
        </div>

        <button type="submit" class="btn btn--primary">Save Changes</button>
        <button type="button" class="btn btn--secondary" onclick="document.getElementById('editModal').classList.add('hidden')">Cancel</button>
    `;

    // Show edit modal
    document.getElementById('editModal').classList.remove('hidden');

    // Setup form submission
    form.onsubmit = (e) => this.saveEditedRecipe(e);

    // Setup add ingredient button
    document.getElementById('editAddIngredient').onclick = () => {
        const list = document.getElementById('editIngredientsList');
        const newRow = document.createElement('div');
        newRow.className = 'ingredient-row';
        newRow.innerHTML = `
            <input type="number" class="form-control ingredient-quantity" placeholder="Qty" step="0.25" required>
            <input type="text" class="form-control ingredient-unit" placeholder="unit" required>
            <input type="text" class="form-control ingredient-name" placeholder="Ingredient name" required>
            <button type="button" class="btn btn--secondary remove-ingredient" onclick="this.parentElement.remove()">Remove</button>
        `;
        list.appendChild(newRow);
    };
}

saveEditedRecipe(e) {
    e.preventDefault();

    const recipeId = parseInt(document.getElementById('editRecipeId').value);
    const recipe = this.recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    // Update recipe data
    recipe.title = document.getElementById('editRecipeTitle').value;
    recipe.course = document.getElementById('editRecipeCourse').value;
    recipe.category = document.getElementById('editRecipeCategory').value;
    recipe.servings = parseInt(document.getElementById('editRecipeServings').value);
    recipe.prepTime = document.getElementById('editRecipePrepTime').value;
    recipe.cookTime = document.getElementById('editRecipeCookTime').value;

    // Update ingredients
    const ingredientRows = document.querySelectorAll('#editIngredientsList .ingredient-row');
    recipe.ingredients = Array.from(ingredientRows).map(row => ({
        quantity: parseFloat(row.querySelector('.ingredient-quantity').value),
        unit: row.querySelector('.ingredient-unit').value,
        ingredient: row.querySelector('.ingredient-name').value
    }));

    // Update instructions (split by double newlines or single newlines)
    const instructionsText = document.getElementById('editRecipeInstructions').value;
    recipe.instructions = instructionsText.split(/\n\n+/).filter(i => i.trim());
    if (recipe.instructions.length === 0) {
        recipe.instructions = instructionsText.split(/\n+/).filter(i => i.trim());
    }

    recipe.notes = document.getElementById('editRecipeNotes').value;

    // Save and refresh
    this.saveRecipesToServer();
    this.renderRecipes();
    this.updateRecipeCount();

    // Close modal
    document.getElementById('editModal').classList.add('hidden');

    alert('Recipe updated successfully!');
}

    updateNutritionDisplay(nutrition) {
        const nutritionSection = document.getElementById('modalNutritionSection');
        const nutritionInfo = document.getElementById('modalNutritionInfo');
        
        if (!nutrition || Object.keys(nutrition).length === 0) {
            nutritionSection.classList.add('hidden');
            return;
        }
        
        const nutritionLabels = {
            calories: 'Calories',
            protein: 'Protein',
            totalFat: 'Total Fat', 
            saturatedFat: 'Saturated Fat',
            cholesterol: 'Cholesterol',
            sodium: 'Sodium',
            totalCarbs: 'Total Carbs',
            dietaryFiber: 'Dietary Fiber',
            sugars: 'Sugars'
        };
        
        nutritionInfo.innerHTML = Object.entries(nutrition)
            .filter(([key, value]) => value && value !== '0' && value !== 0)
            .map(([key, value]) => `
                <div class="nutrition-item">
                    <span class="nutrition-value">${value}</span>
                    <div class="nutrition-label">${nutritionLabels[key] || key}</div>
                </div>
            `).join('');
        
        nutritionSection.classList.remove('hidden');
    }

    updateImageGallery(images) {
        const imagesSection = document.getElementById('modalImagesSection');
        const imageGallery = document.getElementById('modalImageGallery');
        
        if (!images || images.length === 0) {
            imagesSection.classList.add('hidden');
            return;
        }
        
        imageGallery.innerHTML = images.map(imageUrl => `
            <img src="${imageUrl}" alt="Recipe image" class="recipe-image" onclick="window.open('${imageUrl}', '_blank')">
        `).join('');
        
        imagesSection.classList.remove('hidden');
    }

    updateScaledIngredients() {
        const recipe = this.currentRecipe;
        const scaleFactor = this.currentScaledServings / recipe.servings;
        const ingredientsList = document.getElementById('modalIngredientsList');
        
        ingredientsList.innerHTML = recipe.ingredients.map((ing, index) => {
            const scaledQuantity = ing.quantity * scaleFactor;
            const displayQuantity = this.formatQuantity(scaledQuantity);
            
            return `
                <li>
                    <input type="checkbox" id="ing-${index}">
                    <label for="ing-${index}">${displayQuantity} ${ing.unit} ${ing.ingredient}</label>
                </li>
            `;
        }).join('');
        
        ingredientsList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const label = e.target.nextElementSibling;
                label.classList.toggle('checked', e.target.checked);
            });
        });
    }

    formatQuantity(quantity) {
        const fractions = {
            0.125: '1/8',
            0.25: '1/4',
            0.333: '1/3',
            0.5: '1/2',
            0.667: '2/3',
            0.75: '3/4'
        };
        
        const whole = Math.floor(quantity);
        const decimal = quantity - whole;
        
        for (const [dec, frac] of Object.entries(fractions)) {
            if (Math.abs(decimal - parseFloat(dec)) < 0.01) {
                return whole > 0 ? `${whole} ${frac}` : frac;
            }
        }
        
        return quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(2).replace(/\.?0+$/, '');
    }

    renderInstructions(instructions) {
        const instructionsList = document.getElementById('modalInstructionsList');
        instructionsList.innerHTML = instructions.map(instruction => 
            `<li>${instruction}</li>`
        ).join('');
    }

    adjustServings(delta) {
        const newServings = Math.max(1, this.currentScaledServings + delta);
        this.setServings(newServings);
    }

    setServings(servings) {
        if (servings < 1) servings = 1;
        this.currentScaledServings = servings;
        document.getElementById('currentServings').value = servings;
        this.updateScaledIngredients();
    }

    deleteRecipe(recipeId) {
        if (confirm('Are you sure you want to delete this recipe?')) {
            this.recipes = this.recipes.filter(recipe => recipe.id !== recipeId);
            this.saveRecipesToServer();
            this.renderRecipes();
            this.updateRecipeCount();
            this.populateFilters();
        }
    }

    editCurrentRecipe() {
        alert('Edit functionality would open a form to modify the current recipe. For this demo, please use the manual entry form to create a new recipe.');
    }

    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
    }

    showStatus(message, type, element = null) {
        if (!element) {
            element = document.createElement('div');
            element.className = 'status-message';
            document.querySelector('.main-content .container').appendChild(element);
            setTimeout(() => element.remove(), 5000);
        }
        
        element.textContent = message;
        element.className = `status-message ${type}`;
        element.style.display = 'block';
        
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                element.style.display = 'none';
            }, 3000);
        }
    }
}

const recipeManager = new RecipeManager();

document.addEventListener('DOMContentLoaded', () => {
    const removeBtn = document.querySelector('.remove-ingredient');
    if (removeBtn) {
        removeBtn.addEventListener('click', (e) => e.target.closest('.ingredient-row').remove());
    }
});

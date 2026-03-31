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
        
        //this.init();
		this.initRedesign();
    }

// --- WAKE LOCK (CAPACITOR PLUGIN) ---
    async requestWakeLock() {
        // Check if Capacitor and the plugin are available
        if (typeof Capacitor !== 'undefined' && Capacitor.Plugins && Capacitor.Plugins.KeepAwake) {
            try {
                await Capacitor.Plugins.KeepAwake.keepAwake();
                console.log('Device set to keep awake');
            } catch (err) {
                console.error('Failed to set keep awake:', err);
            }
        } else {
            console.log('KeepAwake plugin not found (running in browser?)');
        }
    }

    async releaseWakeLock() {
        if (typeof Capacitor !== 'undefined' && Capacitor.Plugins && Capacitor.Plugins.KeepAwake) {
            try {
                await Capacitor.Plugins.KeepAwake.allowSleep();
                console.log('Device allowed to sleep');
            } catch (err) {
                console.error('Failed to allow sleep:', err);
            }
        }
    }

    init() {
        this.setupEventListeners();
        this.setupTabs();
        this.loadRecipesFromServer();
    }
	
    initRedesign() {
        this.initTheme();
        this.initBottomNav();
        this.initSearch();
        this.initAddTabs();
        this.renderCategoryGrid();
		this.initServingsControls();
		this.initModalActions();
		this.loadRecipesFromServer();
		this.initImportHandlers();
        this.initBackButton();
    }
	
    initBackButton() {
        // Check if we are running in Capacitor context
        if (typeof Capacitor !== 'undefined' && Capacitor.Plugins && Capacitor.Plugins.App) {
            
            Capacitor.Plugins.App.addListener('backButton', ({ canGoBack }) => {
                console.log('Back button pressed');
                
                // 1. Priority: Close any open Modals
                const openModal = document.querySelector('.modal.active');
                if (openModal) {
                    // If the recipe modal is open, or any other modal
                    this.closeModal();
                    // Also specifically ensure share modal is closed if it's separate
                    this.closeShareModal(); 
                    return; // Stop here, don't exit app
                }

                // 2. Priority: Close Search Overlay if open
                const searchOverlay = document.getElementById('searchOverlay');
                if (searchOverlay && searchOverlay.classList.contains('active')) {
                    searchOverlay.classList.remove('active');
                    return;
                }

                // 3. Priority: Navigate Tabs (If not on "Home", go to Home)
                const homeView = document.getElementById('homeView');
                if (homeView && !homeView.classList.contains('active')) {
                    // Manually click the "Home" nav button to trigger the switch
                    const homeBtn = document.querySelector('.nav-item[data-view="homeView"]');
                    if (homeBtn) homeBtn.click();
                    return;
                }

                // 4. If none of the above, actually exit the app
                Capacitor.Plugins.App.exitApp();
            });
        }
    }

    initImportHandlers() {
        console.log('=== initImportHandlers called ===');

        // URL scraping
        const scrapeBtn = document.getElementById('scrapeUrl');
        if (scrapeBtn) {
            scrapeBtn.addEventListener('click', () => {
                console.log('Scrape button clicked!');
                this.scrapeRecipeFromUrl();
            });
            console.log('scrapeUrl listener attached');
        }

        // File upload
        const fileUploadArea = document.getElementById('fileUploadArea');
        const fileInput = document.getElementById('fileInput');

        if (fileUploadArea && fileInput) {
            fileUploadArea.addEventListener('click', () => fileInput.click());
            fileUploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
            fileUploadArea.addEventListener('drop', (e) => this.handleFileDrop(e));
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }

        // Export/Backup Handler
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportRecipes());
        }

        // Import confirmation (only if elements exist)
        const confirmBtn = document.getElementById('confirmImport');
        const cancelBtn = document.getElementById('cancelImport');
        if (confirmBtn) confirmBtn.addEventListener('click', () => this.confirmImport());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.cancelImport());

        console.log('=== initImportHandlers complete ===');
    }

    initTheme() {
        const themeToggle = document.getElementById('themeToggle');
        const html = document.documentElement;

        // 1. Load saved theme
        const currentTheme = localStorage.getItem('theme') || 'light';
        html.setAttribute('data-theme', currentTheme);
        this.updateThemeIcon(currentTheme);
        
        // 2. Set Initial Status Bar Style
        this.updateStatusBarStyle(currentTheme);

        themeToggle.addEventListener('click', () => {
            const theme = html.getAttribute('data-theme');
            const newTheme = theme === 'light' ? 'dark' : 'light';
            
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            this.updateThemeIcon(newTheme);
            
            // 3. Update Status Bar on Toggle
            this.updateStatusBarStyle(newTheme);
        });
    }

// Helper function to talk to Android
updateStatusBarStyle(theme) {
    // Only run if we are in the app (Capacitor exists)
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.StatusBar) {
        const { StatusBar, Style } = window.Capacitor.Plugins;
        
        if (theme === 'dark') {
            // Dark Mode = Dark Background = WE WANT LIGHT ICONS
            StatusBar.setStyle({ style: 'DARK' }); 
            StatusBar.setBackgroundColor({ color: '#1A1D23' }); // Matches your --bg-primary in dark mode
        } else {
            // Light Mode = Light Background = WE WANT DARK ICONS
            StatusBar.setStyle({ style: 'LIGHT' });
            StatusBar.setBackgroundColor({ color: '#FFFFFF' }); // Matches your --bg-primary in light mode
        }
    }
}

    updateThemeIcon(theme) {
        const sunIcon = document.getElementById('sunIcon');
        const moonIcon = document.getElementById('moonIcon');

        if (theme === 'dark') {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        } else {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        }
    }
	
    initModalActions() {
        // Edit button
        document.getElementById('editRecipeBtn').addEventListener('click', () => {
            const recipeId = document.getElementById('modalRecipeTitle').dataset.recipeId;
            this.editRecipe(parseInt(recipeId));
        });
        
        // Delete button
        document.getElementById('deleteRecipeBtn').addEventListener('click', () => {
            const recipeId = document.getElementById('modalRecipeTitle').dataset.recipeId;
            if (confirm('Are you sure you want to delete this recipe?')) {
                this.deleteRecipe(parseInt(recipeId));
                this.closeModal(); 
            }
        });
        
        // Modal back button - ONLY ONE LISTENER HERE
        document.getElementById('modalBackBtn').addEventListener('click', () => {
            this.closeModal();
        });
        
        // Share button logic
        const shareBtn = document.getElementById('shareRecipeBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                const recipeId = document.getElementById('modalRecipeTitle').dataset.recipeId;
                this.currentShareRecipeId = parseInt(recipeId);
                this.showShareModal();
            });
        }
    }

    initBottomNav() {
        const navItems = document.querySelectorAll('.nav-item');

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const targetView = item.dataset.view;

                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');

                document.querySelectorAll('.view').forEach(view => {
                    view.classList.remove('active');
                });

                document.getElementById(targetView).classList.add('active');

                if (targetView === 'homeView') {
                    this.renderCategoryGrid();
                }

                if (targetView === 'recipesView') {
                    this.renderRecipes();
                }
            });
        });
    }

    initSearch() {
        const searchBtn = document.getElementById('searchBtn');
        const searchOverlay = document.getElementById('searchOverlay');
        const searchBackBtn = document.getElementById('searchBackBtn');
        const searchClearBtn = document.getElementById('searchClearBtn');
        const searchInput = document.getElementById('searchInput');

        searchBtn.addEventListener('click', () => {
            searchOverlay.classList.add('active');
            searchInput.focus();
        });

        searchBackBtn.addEventListener('click', () => {
            searchOverlay.classList.remove('active');
            searchInput.value = '';
            document.getElementById('searchResults').innerHTML = '';
        });

        searchClearBtn.addEventListener('click', () => {
            searchInput.value = '';
            document.getElementById('searchResults').innerHTML = '';
            searchInput.focus();
        });

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();

            if (!query) {
                document.getElementById('searchResults').innerHTML = '';
                return;
            }

            const filtered = this.recipes.filter(recipe => {
                return recipe.title.toLowerCase().includes(query) ||
                       recipe.ingredients.some(ing => ing.ingredient.toLowerCase().includes(query)) ||
                       recipe.category.toLowerCase().includes(query) ||
                       recipe.course.toLowerCase().includes(query);
            });

            this.renderSearchResults(filtered);
        });
    }

    renderSearchResults(recipes) {
        const searchResults = document.getElementById('searchResults');

        if (recipes.length === 0) {
            searchResults.innerHTML = '<p style="padding: 2rem; text-align: center; color: var(--text-secondary);">No recipes found</p>';
            return;
        }

        searchResults.innerHTML = recipes.map(recipe => `
            <div class="search-result-item" onclick="recipeManager.openRecipeModal(${recipe.id})">
                <div style="font-weight: 600; margin-bottom: 0.25rem;">${recipe.title}</div>
                <div style="font-size: 0.875rem; color: var(--text-secondary);">
                    ${recipe.course} • ${recipe.category}
                </div>
            </div>
        `).join('');
    }

	renderCategoryGrid() {
		const categoryGrid = document.getElementById('categoryGrid');
		
		const categoryMap = new Map();
		
		this.recipes.forEach(recipe => {
			// Use "Uncategorized" for missing/empty categories
			const category = recipe.category && recipe.category.trim() !== '' 
				? recipe.category 
				: 'Uncategorized';
			
			if (!categoryMap.has(category)) {
				categoryMap.set(category, {
					name: category,
					count: 0,
					recipes: []
				});
			}
			const cat = categoryMap.get(category);
			cat.count++;
			cat.recipes.push(recipe);
		});
		
		const categories = Array.from(categoryMap.values()).sort((a, b) => {
			// Keep "Uncategorized" at the end
			if (a.name === 'Uncategorized') return 1;
			if (b.name === 'Uncategorized') return -1;
			return a.name.localeCompare(b.name);
		});
		
		categoryGrid.innerHTML = categories.map(category => {
			// Try to find a recipe with an image
			let recipeWithImage = category.recipes.find(r => r.images && r.images.length > 0);
			
			// If none found, just pick first recipe
			if (!recipeWithImage) {
				recipeWithImage = category.recipes[0];
			}
			
			const imageUrl = recipeWithImage && recipeWithImage.images && recipeWithImage.images.length > 0 
				? recipeWithImage.images[0] 
				: '';
			
			// Use different emoji for Uncategorized
			const placeholder = category.name === 'Uncategorized' ? '❓' : '🍽️';
			
			return `
				<div class="category-card" onclick="recipeManager.filterByCategory('${category.name}')">
					${imageUrl ? 
						`<img src="${imageUrl}" alt="${category.name}" class="category-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
						 <div class="category-no-image" style="display: none;">${placeholder}</div>` :
						`<div class="category-no-image">${placeholder}</div>`
					}
					<div class="category-info">
						<div class="category-name">${category.name}</div>
						<div class="category-count">
							<span class="count-number">${category.count}</span> 
							${category.count === 1 ? 'recipe' : 'recipes'}
						</div>
					</div>
				</div>
			`;
		}).join('');
	}

    filterByCategory(categoryName) {
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        document.getElementById('recipesView').classList.add('active');

        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        document.querySelector('.nav-item[data-view="recipesView"]').classList.add('active');

        const categoryFilter = document.getElementById('categoryFilter');
        categoryFilter.value = categoryName;

        this.filterRecipes();

        document.getElementById('searchOverlay').classList.remove('active');
    }

    initAddTabs() {
        const addTabBtns = document.querySelectorAll('.add-tab-btn');

        addTabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.addTab;

                addTabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                document.querySelectorAll('.add-tab-content').forEach(content => {
                    content.classList.remove('active');
                });

                document.getElementById(targetTab + 'Tab').classList.add('active');
            });
        });
    }	

    async loadRecipesFromServer() {
            console.log('=== SMART LOAD: Starting ===');
            
            // 1. Load the User's "Saved" recipes (current state)
            // We default to an empty array if nothing is saved yet.
            let userRecipes = [];
            const stored = localStorage.getItem('recipes');
            if (stored) {
                try {
                    userRecipes = JSON.parse(stored);
                    console.log(`Loaded ${userRecipes.length} user recipes from storage.`);
                } catch (e) {
                    console.error('Corrupt storage, starting fresh.', e);
                    userRecipes = [];
                }
            }

            // 2. Load the App's "Bundled" file (the potentially new version)
            try {
                const response = await fetch('recipes.json');
                const systemRecipes = await response.json();
                
                console.log(`Loaded ${systemRecipes.length} system recipes from file.`);

                // 3. THE SMART MERGE
                // Goal: Keep ALL user recipes + Add NEW system recipes that aren't there.
                
                let addedCount = 0;
                const combinedRecipes = [...userRecipes];

                systemRecipes.forEach(sysRecipe => {
                    // Check if we already have this system recipe
                    // We check by ID (if it's a system recipe) OR by Title (to be safe)
                    const alreadyExists = userRecipes.some(u => 
                        (u.id === sysRecipe.id && u.isSystemRecipe) || 
                        u.title === sysRecipe.title
                    );

                    if (!alreadyExists) {
                        // It's new! Add it.
                        // If we have user recipes, we need to ensure the ID doesn't clash.
                        // If the ID is taken, we generate a new safe one.
                        if (combinedRecipes.some(r => r.id === sysRecipe.id)) {
                            const maxId = combinedRecipes.length > 0 
                                ? Math.max(...combinedRecipes.map(r => r.id)) 
                                : 0;
                            sysRecipe.id = maxId + 1;
                        }
                        
                        // Mark it as a system recipe so we know for next time
                        sysRecipe.isSystemRecipe = true;
                        
                        combinedRecipes.push(sysRecipe);
                        addedCount++;
                    } else {
                        // Optional: Update the existing system recipe with new data (fixes typos, etc.)
                        // BUT only if the user hasn't heavily modified it. 
                        // For now, we skip it to be safe.
                    }
                });

                console.log(`Merge complete. Added ${addedCount} new system recipes.`);

                // 4. Update Memory
                this.recipes = combinedRecipes;

                // 5. Update the Counter Logic
                if (this.recipes.length > 0) {
                    const maxId = Math.max(...this.recipes.map(r => r.id));
                    this.currentRecipeId = maxId + 1;
                }

                // 6. Save the merged result back to storage immediately
                // This ensures the new recipes persist.
                this.saveRecipesToServer();

                // 7. Refresh UI
                this.renderRecipes();
                this.updateRecipeCount();
                this.populateFilters();
                this.renderCategoryGrid();

            } catch (err) {
                console.error('Failed to load recipes.json:', err);
                // Fallback: If fetch fails, just show what we have in storage
                if (userRecipes.length > 0) {
                    this.recipes = userRecipes;
                    this.renderRecipes();
                    this.updateRecipeCount();
                    this.populateFilters();
                    this.renderCategoryGrid();
                }
            }
        }

	loadFromJsonFile() {
		fetch('recipes.json')
			.then(res => res.json())
			.then(data => {
				console.log('Loaded recipes from JSON:', data.length);
				this.recipes = data;

				// CRITICAL FIX: Set currentRecipeId to be higher than any existing ID
				if (this.recipes.length > 0) {
					const maxId = Math.max(...this.recipes.map(r => r.id));
					this.currentRecipeId = maxId + 1;
					console.log('Set currentRecipeId to:', this.currentRecipeId);
				}				
				
				localStorage.setItem('recipes', JSON.stringify(data)); // ← Save to localStorage
				this.renderRecipes();
				this.updateRecipeCount();
				this.populateFilters();
				this.renderCategoryGrid();
			})
			.catch(err => {
				console.error('Failed to load recipes:', err);
			});
	}

saveRecipesToServer() {
    // For mobile app, just save to localStorage
    localStorage.setItem('recipes', JSON.stringify(this.recipes));
    console.log('Recipes saved to localStorage');
}

/*exportRecipes() {
    const dataStr = JSON.stringify(this.recipes, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = 'recipes_backup_' + new Date().toISOString().slice(0,10) + '.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}*/

// Import these if you are using modules, otherwise they are available on the window
// const { Share } = Capacitor.Plugins;
// const { Filesystem } = Capacitor.Plugins;

async exportRecipes() {
    try {
        const dataStr = JSON.stringify(this.recipes, null, 2);
        const fileName = 'recipes_backup_' + new Date().toISOString().slice(0, 10) + '.json';

        // 1. Write the file to the app's cache directory (temporary storage)
        const result = await Capacitor.Plugins.Filesystem.writeFile({
            path: fileName,
            data: dataStr,
            directory: 'CACHE', // Use Directory.Cache if using the object
            encoding: 'utf8'
        });

        // 2. Open the native Android Share sheet
        await Capacitor.Plugins.Share.share({
            title: 'Backup Recipes',
            text: 'Here is your recipe backup file.',
            url: result.uri, // This is the internal file:// path
            dialogTitle: 'Exporting Recipes'
        });

    } catch (error) {
        console.error('Export failed', error);
        // Fallback for Web Browser testing
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.recipes));
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', 'backup.json');
        linkElement.click();
    }
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
		
		// Add this somewhere in your initialization
	/*	document.getElementById('modalBackBtn').addEventListener('click', () => {
			document.getElementById('recipeModal').classList.remove('active');
		});		

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal();
            });
        });*/
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

switchTab(tabName) {
    // Old tab system - check if elements exist first
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    if (tabButtons.length > 0) {
        // Old system exists, use it
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        const targetBtn = document.querySelector(`[data-tab="${tabName}"]`);
        const targetContent = document.getElementById(tabName);

        if (targetBtn) targetBtn.classList.add('active');
        if (targetContent) targetContent.classList.add('active');
    } else {
        // New system - switch to recipes view if trying to go to library
        if (tabName === 'library') {
            // Activate recipes view instead
            document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
            document.getElementById('recipesView').classList.add('active');

            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            const recipesNavItem = document.querySelector('.nav-item[data-view="recipesView"]');
            if (recipesNavItem) recipesNavItem.classList.add('active');
        }
    }
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

	async scrapeRecipeFromUrl() {
		const url = document.getElementById('recipeUrl').value.trim();
		const statusEl = document.getElementById('urlStatus');
		
		console.log('scrapeRecipeFromUrl called, URL:', url);
		
		if (!url) {
			this.showStatus('Please enter a URL', 'error', statusEl);
			console.log('No URL provided, exiting');
			return;
		}

		this.showStatus('Extracting recipe data...', 'info', statusEl);
		console.log('Calling Cloud Run API...');
		
		try {
			// YOUR CLOUD RUN URL
			const apiUrl = 'https://recipe-scraper-45718618018.us-central1.run.app/scrape';
			
			const response = await fetch(`${apiUrl}?url=${encodeURIComponent(url)}`);
			const data = await response.json();
			
			console.log('API response:', JSON.stringify(data, null, 2));
			console.log('Recipe title from API:', data.title);
			console.log('Recipe success flag:', data.success);
			
			if (!data.success) {
				throw new Error(data.message || 'Failed to scrape recipe');
			}
			
			// Parse ingredients (recipe-scrapers returns them as strings)
			const parsedIngredients = data.ingredients.map(ing => {
				// Try to parse "2 cups flour" format
				const match = ing.match(/^([\d.\/\s]+)\s+(\w+)\s+(.+)$/);
				if (match) {
					return {
						quantity: parseFloat(match[1].trim()),
						unit: match[2],
						ingredient: match[3]
					};
				}
				// Fallback: just use the string as-is
				return {
					quantity: 1,
					unit: '',
					ingredient: ing
				};
			});
			
			const newRecipe = {
				id: this.currentRecipeId++,
				title: data.title,
				course: 'Dinner', // Default, user can edit later
				category: data.category || 'Main Course',
				collections: ['URL Import'],
				source: url,
				servings: parseInt(data.servings) || 4,
				prepTime: data.prep_time || 'Not specified',
				cookTime: data.cook_time || 'Not specified',
				ingredients: parsedIngredients,
				instructions: data.instructions_list || [],
				notes: data.description || '',
				nutrition: {},
				images: data.image ? [data.image] : []
			};
			
			console.log('Created recipe from API data:', JSON.stringify(newRecipe, null, 2));
			
			this.recipes.push(newRecipe);
			this.saveRecipesToServer();
			this.renderRecipes();
			this.updateRecipeCount();
			this.populateFilters();
			
			this.showStatus('Recipe imported successfully!', 'success', statusEl);
			document.getElementById('recipeUrl').value = '';
			
			setTimeout(() => {
				console.log('Switching to recipes view...');
				// Switch to recipes view
				document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
				document.getElementById('recipesView').classList.add('active');
				
				document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
				const recipesNav = document.querySelector('.nav-item[data-view="recipesView"]');
				if (recipesNav) recipesNav.classList.add('active');
				
				// Reset filters
				const courseFilter = document.getElementById('courseFilter');
				const categoryFilter = document.getElementById('categoryFilter');
				if (courseFilter) courseFilter.value = '';
				if (categoryFilter) categoryFilter.value = '';
				
				this.renderRecipes();
				this.renderCategoryGrid();
				console.log('View switched to recipes, filters reset');
			}, 500);
			
		} catch (error) {
			console.error('Scraping error:', error);
			this.showStatus('Failed to import recipe: ' + error.message, 'error', statusEl);
		}
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
        
        console.log('Processing file:', fileName);
        
        if (!fileName.endsWith('.txt') && !fileName.endsWith('.html') && !fileName.endsWith('.htm') && !fileName.endsWith('.json')) {
            this.showStatus('Please select a .txt, .html, or .json file', 'error', statusEl);
            return;
        }

        this.showProgress(true);
        this.updateProgress(25, 'Reading file...');

        const reader = new FileReader();
        reader.onload = (e) => {
            setTimeout(() => {
                try {
                    let recipes;
                    if (fileName.endsWith('.json')) {
                        this.updateProgress(50, 'Parsing JSON format...');
                        recipes = this.parseRecipeJSON(e.target.result);
                        console.log('Parsed JSON recipes:', recipes);
                    } else if (fileName.endsWith('.html') || fileName.endsWith('.htm')) {
                        this.updateProgress(50, 'Parsing HTML format...');
                        recipes = this.parseRecipeManagerHTML(e.target.result);
                    } else {
                        this.updateProgress(50, 'Parsing text format...');
                        recipes = this.parseRecipeManagerFile(e.target.result);
                    }
                    
                    console.log('Total recipes parsed:', recipes.length);
                    
                    this.updateProgress(75, 'Importing recipes...');
                    
                    // Assign IDs and import directly
                    recipes.forEach(recipe => {
                        recipe.id = this.currentRecipeId++;
                        console.log('Importing recipe:', recipe.title);
                    });
                    
                    // Import directly without preview
                    this.recipes.push(...recipes);
                    this.saveRecipesToServer();
                    this.renderRecipes();
                    this.updateRecipeCount();
                    this.populateFilters();
                    
                    this.updateProgress(100, 'Complete!');
                    
                    setTimeout(() => {
                        this.showProgress(false);
                        this.showStatus(`Successfully imported ${recipes.length} recipe(s)!`, 'success', statusEl);
                        
                        // Switch to recipes view
                        setTimeout(() => {
                            document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
                            document.getElementById('recipesView').classList.add('active');
                            
                            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
                            const recipesNav = document.querySelector('.nav-item[data-view="recipesView"]');
                            if (recipesNav) recipesNav.classList.add('active');
                            
                            // Reset filters so imported recipe shows
                            const courseFilter = document.getElementById('courseFilter');
                            const categoryFilter = document.getElementById('categoryFilter');
                            if (courseFilter) courseFilter.value = '';
                            if (categoryFilter) categoryFilter.value = '';
                            
                            this.renderRecipes();
                        }, 500);
                    }, 500);
                    
                } catch (error) {
                    console.error('File parsing error:', error);
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

    parseRecipeJSON(jsonContent) {
        const data = JSON.parse(jsonContent);
        
        // Handle both single recipe object and array of recipes
        const recipes = Array.isArray(data) ? data : [data];
        
        // Validate and normalize each recipe
        return recipes.map(recipe => {
            // Determine if this is Schema.org format or simple format
            const isSchemaOrg = recipe['@type'] === 'Recipe';
            
            // Extract title
            const title = recipe.title || recipe.name;
            if (!title) {
                throw new Error('Recipe missing title/name');
            }
            
            // Extract ingredients
            let ingredients = [];
            if (isSchemaOrg && recipe.recipeIngredient) {
                // Schema.org format: array of strings
                ingredients = recipe.recipeIngredient.map(ing => {
                    // Try to parse "1 cup flour" format
                    const match = ing.match(/^([\d.\/\s]+)\s+(\w+)\s+(.+)$/);
                    if (match) {
                        return {
                            quantity: parseFloat(match[1].trim()) || 1,
                            unit: match[2],
                            ingredient: match[3]
                        };
                    }
                    return {
                        quantity: 1,
                        unit: '',
                        ingredient: ing
                    };
                });
            } else if (Array.isArray(recipe.ingredients)) {
                // Simple format: already structured
                ingredients = recipe.ingredients;
            }
            
            // Extract instructions
            let instructions = [];
            if (isSchemaOrg && recipe.recipeInstructions) {
                // Schema.org format: array of objects with text property
                instructions = recipe.recipeInstructions.map(inst => {
                    if (typeof inst === 'string') return inst;
                    if (inst.text) return inst.text;
                    return JSON.stringify(inst);
                });
            } else if (Array.isArray(recipe.instructions)) {
                instructions = recipe.instructions;
            } else if (Array.isArray(recipe.instructions_list)) {
                instructions = recipe.instructions_list;
            }
            
            // Extract servings
            let servings = 4; // default
            if (recipe.servings) {
                servings = parseInt(recipe.servings);
            } else if (recipe.recipeYield) {
                // Parse "4 servings" or just "4"
                const match = String(recipe.recipeYield).match(/\d+/);
                servings = match ? parseInt(match[0]) : 4;
            }
            
            // Extract times
            const prepTime = recipe.prepTime || recipe.prep_time || 'Not specified';
            const cookTime = recipe.cookTime || recipe.cook_time || 'Not specified';
            
// 1. Grab the raw category from the imported file
let rawCategory = recipe.category || recipe.recipeCategory || 'Main Course';

// 2. Force it to match your approved categories (from this.categoryTypes)
// If the imported category isn't in your list, default to "Casserole" or "Vegetarian"
const category = this.categoryTypes.includes(rawCategory)
    ? rawCategory
    : 'Other';
            
            // Normalize the recipe structure to match our format
            return {
                title: title,
                course: recipe.course || 'Dinner',
                category: category,
                collections: recipe.collections || [],
                source: recipe.source || recipe.url || '',
                servings: servings,
                prepTime: prepTime,
                cookTime: cookTime,
                ingredients: ingredients,
                instructions: instructions,
                notes: recipe.notes || recipe.description || '',
                nutrition: recipe.nutrition || recipe.nutrients || {},
                images: Array.isArray(recipe.images) ? recipe.images : 
                        recipe.image ? [recipe.image] : []
            };
        });
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
		// Handle null, undefined, or empty
		if (!isoTime || isoTime === '') {
			return 'Not specified';
		}
		
		// If it's already a plain string like "30 minutes", return it
		if (typeof isoTime === 'string' && !isoTime.startsWith('PT')) {
			return isoTime;
		}
		
		// If it's a number, assume it's minutes
		if (typeof isoTime === 'number') {
			if (isoTime === 0) return 'Not specified';
			const hours = Math.floor(isoTime / 60);
			const minutes = isoTime % 60;
			const parts = [];
			if (hours > 0) parts.push(`${hours}h`);
			if (minutes > 0) parts.push(`${minutes}m`);
			return parts.length > 0 ? parts.join(' ') : 'Not specified';
		}
		
		// Handle PT0S or PT0M
		if (isoTime === 'PT0S' || isoTime === 'PT0M') {
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
        if (!progressEl) {
            console.warn('importProgress element not found');
            return;
        }
        
        if (show) {
            progressEl.classList.remove('hidden');
        } else {
            progressEl.classList.add('hidden');
        }
    }

    updateProgress(percent, text) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (progressFill) {
            progressFill.style.width = `${percent}%`;
        }
        if (progressText) {
            progressText.textContent = text;
        }
    }

    showImportPreview(recipes) {
        console.log('showImportPreview called with', recipes.length, 'recipes');
        
        const previewEl = document.getElementById('importPreview');
        const contentEl = document.getElementById('previewContent');
        
        console.log('Preview element:', previewEl);
        console.log('Content element:', contentEl);
        
        if (!previewEl || !contentEl) {
            console.error('Preview elements not found!');
            return;
        }
        
        contentEl.innerHTML = recipes.map(recipe => `
            <div class="preview-recipe">
                <h5>${recipe.title}</h5>
                <div class="preview-preview-meta">
                    ${recipe.course} • ${recipe.category} • ${recipe.servings} servings • ${recipe.ingredients.length} ingredients
                    ${recipe.nutrition.calories ? `• ${recipe.nutrition.calories} cal` : ''}
                </div>
            </div>
        `).join('');
        
        console.log('Showing preview modal...');
        
        // Force display with aggressive styling
        previewEl.style.display = 'flex';
        previewEl.style.position = 'fixed';
        previewEl.style.top = '0';
        previewEl.style.left = '0';
        previewEl.style.right = '0';
        previewEl.style.bottom = '0';
        previewEl.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        previewEl.style.zIndex = '9999';
        previewEl.style.alignItems = 'center';
        previewEl.style.justifyContent = 'center';
        
        console.log('Modal display style:', previewEl.style.display);
        console.log('Modal z-index:', previewEl.style.zIndex);
    }

    confirmImport() {
        this.recipes.push(...this.pendingImportRecipes);
        this.saveRecipesToServer();
        this.renderRecipes();
        this.updateRecipeCount();
        this.populateFilters();
        
        const count = this.pendingImportRecipes.length;
        this.pendingImportRecipes = [];
        
        const importPreview = document.getElementById('importPreview');
        if (importPreview) {
            importPreview.style.display = 'none'; // Hide using style
        }
        
        this.showStatus(`Successfully imported ${count} recipe(s)!`, 'success');
        
        // Switch to recipes view
        setTimeout(() => {
            document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
            document.getElementById('recipesView').classList.add('active');
            
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            const recipesNav = document.querySelector('.nav-item[data-view="recipesView"]');
            if (recipesNav) recipesNav.classList.add('active');
            
            this.renderRecipes();
        }, 500);
    }

    cancelImport() {
        this.pendingImportRecipes = [];
        
        const importPreview = document.getElementById('importPreview');
        if (importPreview) {
            importPreview.style.display = 'none'; // Hide using style
        }
        
        this.showStatus('Import cancelled', 'info');
    }
	
	renderRecipes() {
		console.log('renderRecipes() called, recipes count:', this.recipes.length);
		const recipeGrid = document.getElementById('recipeGrid');
		console.log('recipeGrid element:', recipeGrid);
		const recipes = this.getFilteredRecipes();
		console.log('Filtered recipes count:', recipes.length);
		
		if (recipes.length === 0) {
			recipeGrid.innerHTML = '<p style="padding: 2rem; text-align: center; color: var(--text-secondary);">No recipes found</p>';
			return;
		}

		// Sort recipes alphabetically by title
		const sortedRecipes = recipes.sort((a, b) => {
			return a.title.localeCompare(b.title);
		});

		recipeGrid.innerHTML = sortedRecipes.map(recipe => {
			const imageUrl = recipe.images && recipe.images.length > 0 ? recipe.images[0] : '';
			const prepTime = this.formatTime(recipe.prepTime);
			const cookTime = this.formatTime(recipe.cookTime);

			return `
				<div class="recipe-card" onclick="recipeManager.openRecipeModal(${recipe.id})">
					${imageUrl ? 
						`<img src="${imageUrl}" alt="${recipe.title}" class="recipe-card-image">` :
						`<div class="recipe-card-image" style="background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem;">🍽️</div>`
					}
					<div class="recipe-card-content">
						<div>
							<h3 class="recipe-card-title">${recipe.title}</h3>
							<div class="recipe-card-tags">
								<span class="recipe-tag">${recipe.course}</span>
								<span class="recipe-tag">${recipe.category}</span>
							</div>
						</div>
						<div class="recipe-card-meta">
							${prepTime !== 'Not specified' ? `<span>⏱️ ${prepTime}</span>` : ''}
							${cookTime !== 'Not specified' ? `<span>🔥 ${cookTime}</span>` : ''}
							<span>🍽️ ${recipe.servings} servings</span>
						</div>
					</div>
				</div>
			`;
		}).join('');
	}
	
    getFilteredRecipes() {
        const courseFilterEl = document.getElementById('courseFilter');
        const categoryFilterEl = document.getElementById('categoryFilter');
        const searchInputEl = document.getElementById('searchInput');
        
        const courseFilter = courseFilterEl ? courseFilterEl.value : '';
        const categoryFilter = categoryFilterEl ? categoryFilterEl.value : '';
        const searchTerm = searchInputEl ? searchInputEl.value.toLowerCase() : '';
        
        return this.recipes.filter(recipe => {
            const matchesCourse = !courseFilter || recipe.course === courseFilter;
            const matchesCategory = !categoryFilter || recipe.category === categoryFilter;
            const matchesSearch = !searchTerm || 
                recipe.title.toLowerCase().includes(searchTerm) ||
                recipe.ingredients.some(ing => ing.ingredient.toLowerCase().includes(searchTerm)) ||
                recipe.category.toLowerCase().includes(searchTerm) ||
                recipe.course.toLowerCase().includes(searchTerm);
            
            return matchesCourse && matchesCategory && matchesSearch;
        });
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


    //stop underscroll
    document.body.style.overflow = 'hidden';

    const modal = document.getElementById('recipeModal');
    


    // 1. Ensure it's rendered in the DOM first
    //modal.style.display = 'none';
    modal.style.display = 'block';
    modal.style.zIndex = '2000'; // Force it to the absolute top
    modal.classList.remove('active');

    modal.offsetHeight;

    // 2. Use requestAnimationFrame to ensure the 'display: block' has been 
    // processed by the browser before starting the slide-in animation
    requestAnimationFrame(() => {
        modal.style.transition = '';
        modal.classList.add('active');

    });   

    //set recipe at top
    modal.scrollTop = 0;

    this.currentRecipe = recipe;
    this.currentScaledServings = recipe.servings;
    
    document.getElementById('modalRecipeTitle').textContent = recipe.title;
    document.getElementById('modalRecipeTitle').dataset.recipeId = recipe.id;
    
    // New design - no tags section, just meta values
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
    
    // Servings
    document.getElementById('originalServings').textContent = recipe.servings;
    document.getElementById('currentServings').value = recipe.servings;
    
    // Ingredients and instructions
    this.updateScaledIngredients();
    this.renderInstructions(recipe.instructions);
    
    // Notes
    if (recipe.notes) {
        document.getElementById('modalRecipeNotes').textContent = recipe.notes;
        document.getElementById('modalNotesSection').style.display = 'block';
    } else {
        document.getElementById('modalNotesSection').style.display = 'none';
    }
    
    // Image - new design has single image on right
    const imageEl = document.getElementById('modalRecipeImage');
    if (recipe.images && recipe.images.length > 0) {
        imageEl.src = recipe.images[0];
        imageEl.alt = recipe.title;
        imageEl.style.display = 'block';
    } else {
        // No image - show placeholder
        imageEl.src = '';
        imageEl.alt = 'No image available';
        imageEl.style.display = 'block';
        imageEl.style.background = 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)';
    }
    
    // Show modal
    //document.getElementById('recipeModal').classList.add('active');

    // TRIGGER LOCK HERE
    this.requestWakeLock();
}

    editRecipe(recipeId) {
    const recipe = this.recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    // Close the view modal
    document.getElementById('recipeModal').classList.remove('active');

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
        <button type="button" class="btn btn--secondary" onclick="document.getElementById('editModal').classList.remove('active')">Cancel</button>
    `;

    // Show edit modal
    document.getElementById('editModal').classList.add('active');

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
    this.renderCategoryGrid();

    // Close modal
    this.closeModal();

    this.showStatus('Recipe updated successfully!', 'success');
}


	initServingsControls() {
    document.getElementById('increaseServings').addEventListener('click', () => {
        const input = document.getElementById('currentServings');
        const newValue = parseInt(input.value) + 1;
        input.value = newValue;
        this.currentScaledServings = newValue;
        this.updateScaledIngredients();
    });
    
    document.getElementById('decreaseServings').addEventListener('click', () => {
        const input = document.getElementById('currentServings');
        const newValue = Math.max(1, parseInt(input.value) - 1); // Don't go below 1
        input.value = newValue;
        this.currentScaledServings = newValue;
        this.updateScaledIngredients();
    });
    
    // Also handle manual input changes
    document.getElementById('currentServings').addEventListener('change', (e) => {
        const newValue = Math.max(1, parseInt(e.target.value) || 1);
        e.target.value = newValue;
        this.currentScaledServings = newValue;
        this.updateScaledIngredients();
    });
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
        const ingredientsList = document.getElementById('modalRecipeIngredients');
        
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
        const instructionsList = document.getElementById('modalRecipeInstructions');
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

/* closeModal() {
    this.releaseWakeLock();

    const recipeModal = document.getElementById('recipeModal');
    if (recipeModal) {
        // 1. Remove the active class immediately
        recipeModal.classList.remove('active');
        
        // 2. Snap it back to 100% instantly by disabling transition
        recipeModal.style.transition = 'none';
        
        // 3. Hide it from the layout engine
        recipeModal.style.display = 'none';
        
        // 4. Force a reflow so the "none" and "translateX(100%)" stick
        recipeModal.offsetHeight;
        
        // 5. Re-enable transitions for the next open event
        setTimeout(() => {
            recipeModal.style.transition = '';
        }, 50);
    }

    // Handle other modals
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    });
} */

closeModal() {
    this.releaseWakeLock();

    //relesase scrolling
    document.body.style.overflow = '';  

    const recipeModal = document.getElementById('recipeModal');
    if (recipeModal) {
        // Just remove the active class - let CSS handle the animation
        recipeModal.classList.remove('active');
    }

    // Handle other modals (edit modal, etc.) - but NOT recipeModal
    document.querySelectorAll('.modal:not(#recipeModal)').forEach(modal => {
        modal.classList.add('hidden');
        modal.style.display = 'none';
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

    // Show share modal
    showShareModal() {
        console.log('showShareModal called');
        const modal = document.getElementById('shareModal');
        console.log('Share modal element:', modal);
        
        if (modal) {
            console.log('Setting modal styles...');
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            console.log('Modal should now be visible');
        } else {
            console.error('Share modal not found in DOM!');
        }
    }

    // Close share modal
    closeShareModal() {
        const modal = document.getElementById('shareModal');
        if (modal) {
            // 1. Remove active/visible class for animation
            modal.classList.add('hidden');
            
            // 2. Clear display after the animation finishes
            setTimeout(() => {
                modal.style.display = 'none';
            }, 250); 
        }
    }

    // Share as Text
    async shareAsText() {
        const recipe = this.recipes.find(r => r.id === this.currentShareRecipeId);
        if (!recipe) return;
        
        try {
            //const { Share } = await import('@capacitor/share');
            
            // Format ingredients
            const ingredientsList = recipe.ingredients
                .map(ing => `• ${ing.quantity} ${ing.unit} ${ing.ingredient}`.trim())
                .join('\n');
            
            // Format instructions
            const instructionsList = recipe.instructions
                .map((inst, i) => `${i + 1}. ${inst}`)
                .join('\n\n');
            
            // Create shareable text
            const shareText = `
    ${recipe.title}

    ${recipe.servings} servings | Prep: ${recipe.prepTime} | Cook: ${recipe.cookTime}
    ${recipe.course} • ${recipe.category}

    INGREDIENTS:
    ${ingredientsList}

    INSTRUCTIONS:
    ${instructionsList}

    ${recipe.notes ? '\nNOTES:\n' + recipe.notes : ''}

    Shared from Recipe Manager Pro
            `.trim();
            
            await Capacitor.Plugins.Share.share({
                title: recipe.title,
                text: shareText,
                dialogTitle: 'Share Recipe'
            });
            
            this.closeShareModal();
        } catch (error) {
            console.error('Error sharing as text:', error);
            alert('Failed to share recipe. Please try again.');
        }
    }

    // Share as PDF
    async shareAsPDF() {
        const recipe = this.recipes.find(r => r.id === this.currentShareRecipeId);
        if (!recipe) return;
        
        try {
            const { jsPDF } = window.jspdf;
            /*const { Share } = await import('@capacitor/share');
            const { Filesystem, Directory } = await import('@capacitor/filesystem');*/
            
            // Create PDF
            const doc = new jsPDF();
            let y = 20;
            const leftMargin = 20;
            const rightMargin = 190;
            const lineHeight = 6;
            
            // Title
            doc.setFontSize(22);
            doc.setFont(undefined, 'bold');
            const titleLines = doc.splitTextToSize(recipe.title, rightMargin - leftMargin);
            titleLines.forEach(line => {
                doc.text(line, leftMargin, y);
                y += 10;
            });
            y += 5;
            
            // Meta info
            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text(`${recipe.servings} servings | Prep: ${recipe.prepTime} | Cook: ${recipe.cookTime}`, leftMargin, y);
            y += lineHeight;
            doc.text(`${recipe.course} • ${recipe.category}`, leftMargin, y);
            y += 12;
            
            doc.setTextColor(0, 0, 0);
            
            // Ingredients section
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('Ingredients', leftMargin, y);
            y += 8;
            
            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            recipe.ingredients.forEach(ing => {
                const line = `• ${ing.quantity} ${ing.unit} ${ing.ingredient}`.trim();
                const textLines = doc.splitTextToSize(line, rightMargin - leftMargin - 5);
                
                textLines.forEach(textLine => {
                    if (y > 270) {
                        doc.addPage();
                        y = 20;
                    }
                    doc.text(textLine, leftMargin + 5, y);
                    y += lineHeight;
                });
            });
            
            y += 8;
            
            // Instructions section
            if (y > 240) {
                doc.addPage();
                y = 20;
            }
            
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('Instructions', leftMargin, y);
            y += 8;
            
            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            recipe.instructions.forEach((inst, i) => {
                const stepText = `${i + 1}. ${inst}`;
                const lines = doc.splitTextToSize(stepText, rightMargin - leftMargin - 5);
                
                lines.forEach((line, lineIndex) => {
                    if (y > 270) {
                        doc.addPage();
                        y = 20;
                    }
                    doc.text(line, leftMargin + 5, y);
                    y += lineHeight;
                });
                y += 3; // Extra space between steps
            });
            
            // Notes (if any)
            if (recipe.notes) {
                y += 8;
                
                if (y > 240) {
                    doc.addPage();
                    y = 20;
                }
                
                doc.setFontSize(16);
                doc.setFont(undefined, 'bold');
                doc.text('Notes', leftMargin, y);
                y += 8;
                
                doc.setFontSize(11);
                doc.setFont(undefined, 'normal');
                const noteLines = doc.splitTextToSize(recipe.notes, rightMargin - leftMargin);
                noteLines.forEach(line => {
                    if (y > 270) {
                        doc.addPage();
                        y = 20;
                    }
                    doc.text(line, leftMargin, y);
                    y += lineHeight;
                });
            }
            
            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(9);
                doc.setTextColor(150, 150, 150);
                doc.text(`Shared from Recipe Manager Pro | Page ${i} of ${pageCount}`, leftMargin, 285);
            }
            
            // Convert to base64
            const pdfData = doc.output('datauristring').split(',')[1];
            const fileName = `${recipe.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
            
            // Save to cache
            const result = await Capacitor.Plugins.Filesystem.writeFile({
                path: fileName,
                data: pdfData,
                directory: 'CACHE'
            });
            
            // Share
            await Capacitor.Plugins.Share.share({
                title: recipe.title,
                files: [result.uri],
                dialogTitle: 'Share Recipe as PDF'
            });
            
            this.closeShareModal();
        } catch (error) {
            console.error('Error sharing as PDF:', error);
            alert('Failed to create PDF. Please try again.');
        }
    }

    // Share as JSON
    async shareAsJSON() {
        const recipe = this.recipes.find(r => r.id === this.currentShareRecipeId);
        if (!recipe) return;
        
        try {
            // Create JSON text
            const jsonData = JSON.stringify(recipe, null, 2);
            
            // Share as text (simpler, always works)
            await Capacitor.Plugins.Share.share({
                title: `${recipe.title} - Recipe File`,
                text: jsonData,
                dialogTitle: 'Share Recipe as JSON'
            });
            
            this.closeShareModal();
        } catch (error) {
            console.error('Error sharing as JSON:', error);
            alert('Failed to share recipe file: ' + error.message);
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

this.recipes.push(mockRecipe);
console.log('Recipe added! Total recipes:', this.recipes.length);
this.saveRecipesToServer();
console.log('Recipes saved to localStorage');
this.renderRecipes();
console.log('Recipes rendered');

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        console.log('Recipes loaded:', recipeManager.recipes.length);
        
        // Force render category grid
        if (typeof recipeManager.renderCategoryGrid === 'function') {
            recipeManager.renderCategoryGrid();
        } else {
            console.error('renderCategoryGrid not defined!');
        }
        
        // Also render recipes list
        if (typeof recipeManager.renderRecipes === 'function') {
            recipeManager.renderRecipes();
        }
    }, 1000);
});
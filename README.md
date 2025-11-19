# Recipe Manager Pro 🍳

A full-featured personal recipe management application built with Capacitor for Android, featuring live recipe scraping from 566+ websites via a cloud-based Python API.

![Recipe Manager Pro](https://img.shields.io/badge/platform-Android-green)
![License](https://img.shields.io/badge/license-Personal%20Use-blue)
![Recipes](https://img.shields.io/badge/recipes-213+-orange)

## ✨ Features

### Core Functionality
- 📚 **213 Pre-loaded Recipes** - Curated collection across 15+ categories
- 🔍 **Advanced Search & Filtering** - Search by name, ingredients, course, or category
- 📱 **Offline Support** - All recipes stored locally using localStorage
- ⚖️ **Serving Size Scaling** - Automatically adjust ingredient quantities
- ✏️ **Full CRUD Operations** - Create, read, update, and delete recipes
- 🌐 **Live Recipe Scraping** - Import recipes from 566+ websites with one click
- 🖼️ **Recipe Images** - Full support for recipe photos (204 recipes with images)
- 📊 **Nutritional Information** - Track nutrition data when available

### Import Options
- 🔗 **URL Import** - Scrape recipes directly from supported websites via Cloud API
- 📄 **File Import** - Bulk import from JSON files
- ✍️ **Manual Entry** - Add recipes manually with intuitive form

### UI/UX
- 🎨 **Modern Interface** - Clean, card-based design
- 📱 **Mobile-Optimized** - Built specifically for Android devices
- 🔝 **Fixed Header** - Proper status bar handling (no overlap)
- ⏱️ **Proper Time Formatting** - Clean display of prep and cook times (no more "PT0S"!)
- 🏷️ **Smart Categorization** - Organize by course, category, and custom collections
- 🎯 **Custom App Icon** - Professional Recipe Minder Pro branding

## 🛠️ Tech Stack

### Frontend
- **Languages**: HTML5, CSS3, JavaScript (ES6+)
- **Mobile Framework**: Capacitor 6.x
- **Storage**: Browser localStorage API (works offline!)
- **Architecture**: Vanilla JS with modular RecipeManager class
- **No frameworks**: Pure web technologies for maximum performance

### Backend API (Recipe Scraping)
- **Language**: Python 3.11
- **Framework**: Flask + Gunicorn
- **Scraping Library**: recipe-scrapers 15.9.0 (566+ supported sites)
- **Hosting**: Google Cloud Run (serverless)
- **Cost**: $0/month (free tier - 2M requests/month)
- **Your API**: `https://recipe-scraper-45718618018.us-central1.run.app`

### Build & Development
- **Package Manager**: npm
- **Mobile Build**: Android Studio + Gradle
- **Version Control**: Git
- **Deployment**: Capacitor CLI

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- **Android Studio** (latest version recommended)
- **Google Cloud account** (for API - optional, already deployed)
- **Python 3.11+** (only if modifying the API)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/recipe-manager-pro.git
cd recipe-manager-pro
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Verify Configuration

Your `capacitor.config.json` should have:

```json
{
  "appId": "com.yourname.recipemanager",
  "appName": "Recipe Manager Pro",
  "webDir": "www",
  "bundledWebRuntime": false
}
```

### 4. Copy Files to www Directory

Make sure your latest files are in the `www/` folder:

```bash
# If updating, copy your files
cp index.html www/
cp app.js www/
cp style.css www/
cp recipes.json www/
# Images should already be in www/images/
```

### 5. Sync to Android

```bash
npx cap sync android
```

### 6. Open in Android Studio

```bash
npx cap open android
```

### 7. Build and Run

In Android Studio:
1. Wait for Gradle sync to complete
2. Connect your Android device (USB debugging enabled)
3. Click the green "Run" button (▶️)
4. App installs and launches on your phone!

## 📁 Project Structure

```
recipe-manager-pro/
├── index.html              # Main HTML file
├── app.js                  # Core application logic (~1,200 lines)
├── style.css               # Styles and responsive design
├── recipes.json            # Recipe data (213 recipes, 676KB)
├── capacitor.config.json   # Capacitor configuration
├── package.json            # Node dependencies
│
├── www/                    # Web directory (deployed to Android)
│   ├── index.html         # (Copy of main files)
│   ├── app.js
│   ├── style.css
│   ├── recipes.json
│   └── images/            # Recipe images (204 images)
│
├── .gitignore             # Git ignore rules
└── README.md              # This file

Note: android/, node_modules/, and old files/ excluded from repo
```

## 🔧 Configuration

### API URL Configuration

The recipe scraping API is already deployed and configured in `app.js` (line ~1075):

```javascript
const apiUrl = 'https://recipe-scraper-45718618018.us-central1.run.app/scrape';
```

**Your API is live and costs $0/month!**

### Storage Configuration

The app uses localStorage for all recipe data:
- Loads from `recipes.json` on first run
- Saves all changes to localStorage
- Works completely offline after initial load
- No server required for daily use

### Image Configuration

- Images stored in `www/images/`
- Paths in `recipes.json` are relative: `"images/abc123.jpg"`
- 204 of 213 recipes include images
- Images automatically display in recipe cards

## 📱 Features in Detail

### Recipe Import from URL

Your API supports **566+ recipe websites** including:
- AllRecipes
- Food Network  
- Tasty
- Bon Appetit
- Serious Eats
- Epicurious
- NYT Cooking
- BBC Good Food
- And 558 more!

**How it works:**
1. Tap "Add Recipe" → "From URL"
2. Paste any supported recipe URL
3. App sends URL to your Cloud Run API
4. API scrapes and returns structured data
5. Recipe automatically added to your collection

**Extracts:**
- Title
- Ingredients (with quantities and units)
- Step-by-step instructions
- Prep time & cook time
- Servings
- Recipe images
- Nutritional info (when available)
- Source URL

### Search & Filter

**Search:**
- Real-time search as you type
- Searches recipe titles, ingredients, and categories
- Case-insensitive
- Instant results

**Filters:**
- **By Course**: All, Breakfast, Lunch, Dinner, Dessert, Snacks, Appetizers
- **By Category**: Chicken, Beef, Pork, Pasta, Salads, Soups, and more
- **Sort**: By name (A-Z)
- **Count**: Shows X of Y recipes

### Recipe Scaling

Intelligently adjust serving sizes:
- Original serving size displayed
- Use +/- buttons or enter custom amount
- All ingredient quantities recalculated automatically
- Fractions handled properly (1/2 cup, 3/4 teaspoon, etc.)
- Updates in real-time

### Editing Recipes

Full editing capabilities:
- Modify title, course, category
- Update serving size, prep/cook times
- Edit ingredients (quantity, unit, description)
- Reorder or remove ingredients
- Edit step-by-step instructions
- Update notes
- Changes save to localStorage

## 🌐 The Recipe Scraping API

### API Details

**Endpoint**: `https://recipe-scraper-45718618018.us-central1.run.app`

**Health Check**:
```bash
GET https://recipe-scraper-45718618018.us-central1.run.app/
```

**Scrape Recipe**:
```bash
GET https://recipe-scraper-45718618018.us-central1.run.app/scrape?url=RECIPE_URL
```

**List Supported Sites**:
```bash
GET https://recipe-scraper-45718618018.us-central1.run.app/supported-sites
```

### API Technology

- Python Flask server
- `recipe-scrapers` library (actively maintained, 566+ sites)
- Deployed on Google Cloud Run (serverless)
- Automatically scales (0 to 1000 instances)
- Cold start: ~2-3 seconds
- Warm response: ~500ms

### API Cost Analysis

**Free Tier (Google Cloud Run):**
- 2 million requests/month
- 360,000 GB-seconds of memory
- 180,000 vCPU-seconds

**Your Usage:**
- ~10-20 recipe imports/month
- Each request: ~2 seconds compute time
- Total monthly cost: **$0.00**

You'd need to import 100,000+ recipes/month to pay anything!

### Redeploying the API

If you need to update the API:

```bash
# Navigate to your API folder
cd /path/to/api-folder

# Redeploy
gcloud run deploy recipe-scraper --source . --region us-central1
```

Takes 2-3 minutes to update.

## 🔒 Privacy & Data

- **All recipes stored locally** on your device (localStorage)
- **No analytics or tracking**
- **No user accounts or login**
- **Recipe scraping API doesn't store data**
- Images stored locally in app package
- Works completely offline after initial setup

## 🧪 Development

### Local Testing

Test in a browser before deploying to Android:

```bash
# Option 1: Just open the file
# Open www/index.html in Chrome

# Option 2: Use a local server
cd www
npx http-server -p 8080

# Then visit: http://localhost:8080
```

### Making Changes

**Workflow:**
1. Edit HTML/CSS/JS files in root directory
2. Copy changes to `www/` folder
3. Test in browser
4. Sync to Android: `npx cap sync android`
5. Test on device

**Or edit directly in www/ folder:**
1. Edit `www/app.js`, `www/style.css`, etc.
2. Sync: `npx cap sync android`
3. Test on device

### Debugging

**Web (Chrome DevTools):**
- Open `www/index.html`
- Press F12
- Console, Network, Elements tabs available

**Android (Remote Debugging):**
1. Connect phone via USB
2. Chrome: Navigate to `chrome://inspect`
3. Find your device
4. Click "Inspect" on the WebView
5. Full DevTools for the running app!

**Common Debug Commands:**
```javascript
// In console
recipeManager.recipes  // View all recipes
localStorage.getItem('recipes')  // View raw storage
recipeManager.loadRecipesFromServer()  // Reload recipes
```

## 📦 Building for Release

### Create Signed APK

1. In Android Studio: **Build** → **Generate Signed Bundle/APK**
2. Select **APK**
3. Create a new keystore (first time) or select existing
4. Choose **release** build variant
5. APK created in `android/app/release/app-release.apk`

### Keystore (Keep Safe!)

Your signing key is critical:
- **Keep the keystore file secure** (backup to cloud)
- **Never lose the password**
- Required for all future updates
- Can't publish updates without it

### Before Release Checklist

- [ ] Test all features on physical device
- [ ] Verify recipe scraping works
- [ ] Check all images load correctly
- [ ] Test on different screen sizes
- [ ] Remove any console.log statements
- [ ] Update version in `package.json`
- [ ] Clean unused files

## 🐛 Troubleshooting

### App Won't Load Recipes

**Issue**: Blank screen or no recipes showing

**Solutions**:
1. Check `recipes.json` is in `www/` folder
2. Clear app data: Settings → Apps → Recipe Manager → Clear Data
3. Reinstall the app
4. Check browser console for errors

### Images Not Showing

**Issue**: Recipe cards show no images

**Solutions**:
1. Verify images are in `www/images/` folder
2. Check image paths in `recipes.json` are relative
3. Re-sync: `npx cap sync android`
4. Clear app cache and reinstall

### Recipe Scraping Fails

**Issue**: "Failed to import recipe" error

**Solutions**:
1. Verify API is running: Visit `https://recipe-scraper-45718618018.us-central1.run.app/`
2. Check if website is supported: `/supported-sites` endpoint
3. Try a different recipe URL
4. Wait a few seconds and try again (cold start)
5. Check your internet connection

### Android Build Fails

**Issue**: Gradle sync or build errors

**Solutions**:
1. Run `npx cap sync android` again
2. In Android Studio: **File** → **Invalidate Caches** → Restart
3. Clean project: **Build** → **Clean Project**
4. Rebuild: **Build** → **Rebuild Project**
5. Check Android SDK is installed (Settings → SDK Manager)

### Status Bar Overlaps Header

**Issue**: Header cut off by status bar (shouldn't happen, but just in case)

**Solution**: Already fixed in `style.css` with:
```css
.app-header {
    padding-top: env(safe-area-inset-top);
}
```

If still an issue, add more padding or check device-specific issues.

## 🎯 Known Limitations

- **Offline scraping**: Can't scrape recipes without internet (API call required)
- **Image storage**: Images stored locally (can make APK large)
- **No cloud sync**: Recipes only on one device
- **No backup**: Clear app data = lose recipes (export periodically)
- **Android only**: No iOS version (could be added with Capacitor)

## 🚧 Future Enhancement Ideas

Ideas for v2.0:

- [ ] Cloud sync with Firebase
- [ ] Recipe export to PDF
- [ ] Shopping list generation
- [ ] Meal planning calendar
- [ ] Recipe ratings and reviews
- [ ] Social sharing
- [ ] Barcode scanner for pantry items
- [ ] Voice-guided cooking mode
- [ ] Recipe recommendations based on ingredients
- [ ] Nutrition tracking
- [ ] Timer integration
- [ ] Multiple language support

## 📊 Project Stats

- **Total Recipes**: 213
- **Recipes with Images**: 204
- **Categories**: 15+
- **Courses**: 7
- **JavaScript Lines**: ~1,200
- **HTML Lines**: ~400
- **CSS Lines**: ~1,000
- **API Supported Sites**: 566+
- **Development Time**: Several awesome coding sessions!
- **Cost**: $0.00/month

## 📄 License

**Personal use only.** Not licensed for commercial use or redistribution.

This app was built for personal recipe management. Feel free to fork and modify for your own use, but please don't redistribute or commercialize.

## 🙏 Acknowledgments

- **recipe-scrapers** - Amazing Python library for recipe scraping
- **Capacitor** - Cross-platform app framework by Ionic
- **Google Cloud Run** - Serverless hosting platform
- **Flask** - Lightweight Python web framework
- All the recipe websites that provide structured data

## 👤 Author

Built with ❤️ for personal use

**Contact**: [Your email/GitHub]

## 🔗 Links

- **Live API**: https://recipe-scraper-45718618018.us-central1.run.app
- **API Health Check**: https://recipe-scraper-45718618018.us-central1.run.app/
- **Supported Sites**: https://recipe-scraper-45718618018.us-central1.run.app/supported-sites

---

**Happy Cooking!** 🍽️👨‍🍳

*Last updated: November 2025*

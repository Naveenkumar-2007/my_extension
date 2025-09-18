# Killer AI Chrome Extension

A powerful Chrome extension that provides AI-powered text explanation and answering using Google's Gemini API.

## Features

- **Context Menu Integration**: Right-click on selected text to access AI features
- **Three Actions**:
  - 📖 **Explain**: Get detailed explanations of selected text
  - 💡 **Answer**: Get direct answers to questions
  - 📋 **Copy**: Copy selected text to clipboard
- **Modern UI**: Clean, minimal design with green theme
- **Fast Responses**: Optimized for quick AI responses
- **Error Handling**: Robust error handling with retry functionality

## Installation

### Method 1: Load Unpacked Extension (Developer Mode)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" by toggling the switch in the top right
3. Click "Load unpacked" button
4. Select the `killer-extension` folder
5. The extension should now appear in your extensions list

### Method 2: Manual Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Turn on "Developer mode"
4. Click "Load unpacked" and select the extension folder
5. Pin the extension to your toolbar for easy access

## Usage

1. **Select Text**: Highlight any text on any webpage
2. **Right Click**: Open the context menu
3. **Choose Action**: Select from the Killer AI submenu:
   - "📖 Explain" - Get a detailed explanation
   - "💡 Answer" - Get a direct answer
   - "📋 Copy (Ctrl+C)" - Copy to clipboard
4. **View Results**: The extension popup will open showing the AI response

### Keyboard Shortcuts (in popup)
- `Ctrl+C` / `Cmd+C`: Copy AI response
- `Ctrl+R` / `Cmd+R`: Retry failed request
- `Escape`: Clear and reset

## File Structure

```
killer-extension/
├── manifest.json       # Extension configuration
├── background.js       # Service worker for API calls and context menus
├── content.js          # Content script for clipboard operations
├── popup.html          # Popup interface structure
├── popup.css           # Popup styling (green theme)
├── popup.js            # Popup functionality and communication
├── icon16.png          # Extension icon (16x16)
├── icon48.png          # Extension icon (48x48)
├── icon128.png         # Extension icon (128x128)
└── README.md           # This file
```

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **API**: Google Gemini Pro API
- **Permissions**: contextMenus, activeTab, clipboardWrite, storage
- **Architecture**: Service Worker + Content Script + Popup
- **Framework**: Vanilla JavaScript (no dependencies)

## Configuration

The extension uses Google's Gemini API. The API key is configured in `background.js`:

```javascript
const API_KEY = "AIzaSyCfZItZ--E2PuaUzJXd9NMGIobwRhmpKFE";
```

## Features in Detail

### Context Menu
- Appears only when text is selected
- Hierarchical menu structure with parent "Killer AI" item
- Icons for each action type

### Popup Interface
- **Header**: Shows extension status and branding
- **Content Area**: Displays questions, answers, loading states, and errors
- **Footer**: Action buttons for copying responses and clearing data
- **Responsive**: Adapts to different screen sizes

### AI Integration
- Uses Google Gemini Pro model
- Optimized prompts for better responses
- Configurable temperature and token limits
- Error handling for API failures

### User Experience
- Loading spinners during API calls
- Success/error notifications
- Smooth animations and transitions
- Accessible design with proper contrast

## Troubleshooting

### Extension Not Loading
1. Check that Developer mode is enabled
2. Verify all files are present in the folder
3. Check the Chrome Extensions page for error messages

### API Errors
1. Verify internet connection
2. Check that the API key is valid
3. Ensure the API endpoint is accessible

### Context Menu Not Appearing
1. Make sure text is selected before right-clicking
2. Check that the extension is enabled
3. Try refreshing the webpage

## Privacy & Security

- No user data is stored permanently
- API calls are made securely over HTTPS
- Selected text is only sent to Google's API when explicitly requested
- No tracking or analytics

## Development

To modify or extend the extension:

1. Edit the relevant files
2. Reload the extension in `chrome://extensions/`
3. Test the changes on various websites

### Key Components
- **background.js**: Handles API communication and context menus
- **content.js**: Manages clipboard operations and notifications
- **popup.js**: Controls the user interface and data display
- **popup.css**: Defines the visual appearance

## Support

For issues or questions:
1. Check the Chrome Extensions developer console for errors
2. Verify all permissions are granted
3. Ensure the API key is valid and has sufficient quota

## License

This project is open source and available under the MIT License.
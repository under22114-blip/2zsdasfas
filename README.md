# Roblox Community Wealth Tracker

A Chrome extension that tracks Roblox community member wealth based on limited item ownership. The extension extracts community IDs from Roblox community links and fetches member profiles to rank them by wealth.

## Features

- **Community ID Extraction**: Automatically extracts community IDs from Roblox community links (2025 format)
- **Fast Member Fetching**: Efficiently fetches all community members, even for large communities with millions of members
- **Wealth Calculation**: Calculates member wealth based on limited items worth over 10,000 Robux
- **Real-time Ranking**: Ranks members by wealth (RAP value) in descending order
- **Refresh Functionality**: Update member data without re-entering the community link
- **Modern UI**: Clean, responsive interface with progress indicators
- **Data Persistence**: Stores community data locally for quick access

## Installation

### Method 1: Load Unpacked Extension (Recommended for Development)

1. Download or clone this repository to your local machine
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the folder containing the extension files
5. The extension should now appear in your extensions list

### Method 2: Install from Chrome Web Store (When Available)

1. Visit the Chrome Web Store (link will be provided when published)
2. Click "Add to Chrome"
3. Confirm the installation

## Usage

### Basic Usage

1. **Click the extension icon** in your Chrome toolbar
2. **Enter a Roblox community link** in the input field
   - Example: `https://www.roblox.com/communities/35461612/Z9-Market#!/about`
3. **Click "Search for List"** to begin fetching community members
4. **Wait for processing** - the extension will show progress as it fetches members
5. **View results** - members will be ranked by wealth with their RAP values displayed

### Advanced Features

- **Refresh Button**: Click "Refresh" to update member data without re-entering the link
- **Auto-detection**: The extension automatically detects when you're on a Roblox community page
- **Progress Tracking**: Real-time progress indicators show fetching and processing status
- **Error Handling**: Clear error messages for invalid links or network issues

## How It Works

### Community ID Extraction

The extension parses Roblox community URLs to extract the numeric community ID:

```
Input: https://www.roblox.com/communities/35461612/Z9-Market#!/about
Output: 35461612
```

### Member Fetching

1. **Member Count Detection**: Scrapes the community page to determine total member count
2. **Batch Processing**: Fetches members in parallel batches for optimal speed
3. **Username Extraction**: Extracts usernames from community member pages
4. **Wealth Calculation**: Fetches each member's limited item inventory and calculates total RAP value

### Wealth Calculation

- Only counts limited items with value > 10,000 Robux
- Uses Roblox's economy API to get recent average prices
- Displays total RAP value next to each username
- Ranks members from highest to lowest wealth

## Technical Details

### Architecture

- **Manifest V3**: Modern Chrome extension architecture
- **Content Scripts**: Run on Roblox pages for data extraction
- **Background Service Worker**: Handles background tasks and communication
- **Local Storage**: Stores community data for persistence
- **Parallel Processing**: Optimized for speed with batch processing

### API Endpoints

- Roblox Community Pages: `https://www.roblox.com/communities/{id}/members`
- Roblox Economy API: `https://economy.roblox.com/v1/users/{username}/assets/collectibles`

### Performance Optimizations

- **Batch Processing**: Fetches members in configurable batch sizes
- **Parallel Requests**: Processes multiple members simultaneously
- **Progress Indicators**: Real-time feedback during long operations
- **Error Recovery**: Continues processing even if individual requests fail

## File Structure

```
roblox-community-wealth-tracker/
├── manifest.json          # Extension configuration
├── popup.html            # Main user interface
├── popup.css             # Styling for the popup
├── popup.js              # Main extension logic
├── content.js            # Content script for Roblox pages
├── background.js         # Background service worker
└── README.md             # This file
```

## Troubleshooting

### Common Issues

1. **"Invalid community link format"**
   - Ensure you're using a valid Roblox community link
   - The link should contain `/communities/{id}/` in the URL

2. **"No members found"**
   - The community might be private or have no members
   - Check if the community ID is correct

3. **Slow performance**
   - Large communities may take time to process
   - The extension processes members in batches for optimal speed

4. **Network errors**
   - Check your internet connection
   - Roblox servers might be experiencing issues

### Performance Tips

- Use the refresh button instead of re-entering links
- The extension stores data locally for faster subsequent access
- Large communities are processed efficiently with batch processing

## Privacy & Security

- **No Data Collection**: The extension doesn't collect or transmit personal data
- **Local Storage**: All data is stored locally in your browser
- **Roblox API Only**: Only communicates with official Roblox APIs
- **No Third-party Services**: No external services are used

## Limitations

- **Rate Limiting**: Roblox may rate-limit requests for very large communities
- **API Changes**: Roblox may update their website structure, requiring extension updates
- **Private Communities**: Cannot access private or restricted communities
- **Limited Items Only**: Only counts limited items, not regular items or currency

## Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## License

This project is open source and available under the MIT License.

## Support

For support, please:
1. Check the troubleshooting section above
2. Review the console for error messages
3. Submit an issue with detailed information about the problem

## Changelog

### Version 1.0
- Initial release
- Community ID extraction
- Member fetching and wealth calculation
- Modern UI with progress indicators
- Local data storage
- Refresh functionality
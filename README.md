# Daily Task Flow - Browser Activity Analyzer

## Overview
Daily Task Flow is a powerful Chrome extension that helps you understand your browsing habits by tracking and analyzing your web activity. It provides detailed insights into your daily and weekly browsing patterns, helping you be more mindful of your online time.

## Features

### Real-Time Activity Tracking
- Tracks actual website visits (not just tab operations)
- Automatically categorizes websites into meaningful groups
- Filters out browser-specific pages for cleaner data

### Daily View
- Shows today's browsing activity in chronological order
- Displays website titles and domains
- Updates in real-time as you browse

### Weekly Analysis
1. **Summary Statistics**
   - Total number of website visits
   - Average visits per day
   - Identification of peak browsing times

2. **Day of Week Analysis**
   - Activity breakdown by day of week
   - Visual bar charts for easy comparison
   - Highlights your busiest days
   - Average daily activity metrics

3. **Website Categories**
   - Automatic categorization of websites:
     - Search
     - Email
     - Development
     - Entertainment
     - Productivity
     - Other

4. **Most Visited Websites**
   - Top 5 most frequently visited domains
   - Visit counts for each domain

5. **Daily Breakdown**
   - Detailed view for each day
   - Collapsible sections for easy navigation
   - Chronological list of visits with timestamps

## Installation

1. Clone this repository or download the source code
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. Selecting your "Daily Task Flow" folder
6. The extension icon should appear in your Chrome toolbar

## Usage

1. **Daily View**
   - Click the extension icon to see today's activity
   - Each entry shows the time, website title, and domain

2. **Weekly Analysis**
   - Click the "Weekly Summary" tab
   - Browse through different sections:
     - Overall summary
     - Day of week patterns
     - Category breakdown
     - Top websites
     - Daily details

3. **Detailed Daily View**
   - In the weekly analysis, click "Show Details" for any day
   - View all visits for that day with timestamps
   - See category breakdowns for specific days

## Privacy & Security

- All data is stored locally in your browser
- No data is sent to external servers
- Only tracks actual website visits
- Automatically filters out sensitive browser pages
- You can clear data through Chrome's extension settings

## Technical Details

### Files Structure
- `manifest.json`: Extension configuration
- `Background.js`: Background service worker for tracking
- `popup.html`: Extension popup interface
- `popup.js`: Main logic for analysis and display

### Technologies Used
- JavaScript (ES6+)
- Chrome Extension APIs
- HTML5
- CSS

### Storage
- Uses Chrome's local storage API
- Efficiently stores and retrieves browsing data
- Maintains data persistence across browser sessions

## Contributing

Feel free to contribute to this project:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Future Enhancements

Planned features for future releases:
- Export data functionality
- Custom categories
- Time-based goals and limits
- Advanced analytics
- Data visualization improvements


## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have suggestions:
1. Check existing issues in the repository
2. Create a new issue with detailed information
3. Include steps to reproduce any bugs

## Acknowledgments

Thanks to all contributors who have helped make this extension better!

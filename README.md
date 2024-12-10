# SP-Live-Indicator

SP-Live-Indicator is WebSocket-based and tracks fronting alters and updates an emoji list based on their status. It uses the API to fetch and manage member data

## Requirements

- Node.js (version 14 or higher)
- npm (or yarn)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/BellaBeaBaby/SP-Live-Indicator
   cd SP-Live-Indicator
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Edit the `.env` file in the root directory\
Replace `YOUR_SP_READ_TOKEN` with the actual token token and\
`YOUR INDICATOR FIELD NAME` with the name of the custom field you want to track.

## Usage

1. Create your project
2. Import IndicatorTracker

   ```
   import IndicatorTracker from './SP-Live-Indicator.js';
   const tracker = new IndicatorTracker();
   ```

3. Re-Assign the indicatorListChange function

   ```
   tracker.indicatorListChange = (newList) => {Your_Function(newlist)}
   ```
   
5. The list of current indicators will be input into your function whenever there’s a change in it

## License

This project is licensed under the MIT License.

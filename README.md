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

3. edit the `.env` file in the root directory of the project and add the following:

   ```env
    SIMPLY_READ_TOKEN=YOUR_SP_READ_TOKEN
    INDICATOR_FIELD_NAME=YOUR INDICATOR FIELD NAME
   ```

4. Replace `YOUR_SP_READ_TOKEN` with the actual token token and `YOUR INDICATOR FIELD NAME` with the name of the custom field you want to track.

## Usage

1. Start the application:

   ```bash
   npm start
   ```

2. The application will fetch member data and listen for live updates via WebSocket. 
The list of emojis will be logged in the console whenever there’s a change in the front members' live status. 

Of course you can replace this with whatever implementation you have planned. 
I may add some implementations of my own in the future

## License

This project is licensed under the MIT License.

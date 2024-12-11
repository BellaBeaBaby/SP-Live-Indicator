import WebSocket from 'ws';
import axios from 'axios';
import dotenv from 'dotenv'

dotenv.config()

/**
 * Retrieves the system ID using an API call
 * @returns {Promise<string>} - The system ID
 */
async function getSystemID() {
    const response = await axios.get('https://api.apparyllis.com/v1/me', {
        headers: {
            'authorization': process.env.SIMPLY_READ_TOKEN
        }
    });
    return response.data.id;
}

/**
 * Retrieves the SignOff ID using the system ID
 * @returns {Promise<string>} - The SignOff ID
 */
async function getSignOffID(systemID) {
    const response = await axios.get(`https://api.apparyllis.com/v1/customFields/${systemID}`, {
        headers: {
            'authorization': process.env.SIMPLY_READ_TOKEN
        }
    });
    return response.data.find(item => item.content?.name === process.env.INDICATOR_FIELD_NAME).id;
}

// Fetch initial front members
async function initialFront(){
    const response = await axios.get('https://api.apparyllis.com/v1/fronters/', {
        headers: {
            'authorization': process.env.SIMPLY_READ_TOKEN
        }
    });
    return response.data
}

/**
 * Retrieves the list of members who have a SignOff field value
 * @returns {Promise<Array>} - Array of all members (no filtering needed)
 */
async function getMembers(systemID) {
    const response = await axios.get(`https://api.apparyllis.com/v1/members/${systemID}`, {
        headers: {
            'authorization': process.env.SIMPLY_READ_TOKEN
        }
    });

    return response.data; // Return all members, filtering done in updateEmojiList
}

// Global variables for tracking IDs and member lists
 // Variable to store the current emoji list

class IndicatorTracker {
    constructor(){
        this.signOffID = null;
        this.systemID = null;
        this.frontList = [];
        this.allMembers = [];
        this.currentEmojiList = [];
    }
    
    async initializeSystem() {
        this.systemID = await getSystemID();
        this.signOffID = await getSignOffID(this.systemID);
        this.allMembers = await getMembers(this.systemID);
        const frontMembers = await initialFront()
        this.frontList = frontMembers.map(item => item.content.member); // Update frontList with current members
        this.updateEmojiList(); // Run emoji list update
    }
    /**
     * Updates the frontList based on the member's state (live or not)
     * @param {string} id - The member ID to update
     * @param {boolean} state - The live state of the member (true for live, false for not)
     */
    updateFront(id, state) {
        
        if (state && !this.frontList.includes(id)) {
            this.frontList.push(id); // Add member to frontList if they are live
        }
        if (!state && this.frontList.includes(id)) {
            this.frontList.splice(this.frontList.indexOf(id), 1); // Remove member from frontList if they are not live
        }
        this.updateEmojiList();
    }

    /**
     * Generates and logs a list of emojis for the members in frontList
     */
    updateEmojiList() {
        const newEmojiList = this.frontList.map(id => {
            const member = this.allMembers.find(member => member.id === id);
            const emoji = member?.content?.info?.[this.signOffID]; 
            return emoji ? emoji : null;
        }).filter(emoji => emoji !== null); // Exclude null values

        // Only log or process the emoji list if it has changed and is not empty
        if (JSON.stringify(newEmojiList) !== JSON.stringify(this.currentEmojiList) && newEmojiList.length > 0) {
            this.currentEmojiList = newEmojiList; // Store the updated emoji list
            this.indicatorListUpdate(newEmojiList);
        }
    }
    
    indicatorListUpdate(newList) {console.log(newList)}
    
    connectWebSocket() {
        // Create WebSocket connection to server
        const socket = new WebSocket('wss://api.apparyllis.com/v1/socket');

        // WebSocket event handler for when the connection is opened
        socket.onopen = () => {
            console.log('Connected to Production WebSocket');

            // Send authentication payload to the WebSocket
            const authPayload = {
                op: 'authenticate',
                token: process.env.SIMPLY_READ_TOKEN
            };
            socket.send(JSON.stringify(authPayload));

            // Periodically send a ping to the server every 10 seconds to keep the connection alive
            setInterval(() => {
                socket.send('ping');
            }, 10000); // 10 seconds
        };

        // WebSocket event handler for receiving messages
        socket.onmessage = (event) => {
            try {
                const parsed = JSON.parse(event.data);
                if (parsed.target === 'frontHistory') {
                    this.updateFront(parsed.results[0].content.member, parsed.results[0].content.live);
                }
            } catch (error) {
                // If an error occurs while parsing the WebSocket message, ignore it
            }
        };

        // WebSocket event handler for errors
        socket.onerror = (error) => {console.error('WebSocket error:', error);};

        // WebSocket event handler for when the connection is closed
        socket.onclose = () => {console.log('Connection closed');};
    }
};

export default IndicatorTracker;

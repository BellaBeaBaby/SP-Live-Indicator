import WebSocket from 'ws';
import axios from 'axios';
import dotenv from 'dotenv'

dotenv.config()

// Global variables for tracking IDs and member lists
let signOffID;
let systemID;
let frontList = [];
let allMembers = [];
let currentEmojiList = []; // Variable to store the current emoji list

/**
 * Updates the frontList based on the member's state (live or not)
 * @param {string} id - The member ID to update
 * @param {boolean} state - The live state of the member (true for live, false for not)
 */
function updateFront(id, state) {
    if (state && !frontList.includes(id)) {
        frontList.push(id); // Add member to frontList if they are live
    }
    if (!state && frontList.includes(id)) {
        frontList.splice(frontList.indexOf(id), 1); // Remove member from frontList if they are not live
    }
    // Update emoji list after modifying the frontList
    updateEmojiList();
}

/**
 * Generates and logs a list of emojis for the members in frontList
 */
function updateEmojiList() {
    const emojiList = frontList.map(id => {
        const member = allMembers.find(member => member.id === id);
        const emoji = member?.content?.info?.[signOffID]; 
        return emoji ? emoji : null;
    }).filter(emoji => emoji !== null); // Exclude null values

    // Only log or process the emoji list if it has changed and is not empty
    if (JSON.stringify(emojiList) !== JSON.stringify(currentEmojiList) && emojiList.length > 0) {
        currentEmojiList = emojiList; // Store the updated emoji list
        console.log(emojiList);
    }
}

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
async function getSignOffID() {
    const response = await axios.get(`https://api.apparyllis.com/v1/customFields/${systemID}`, {
        headers: {
            'authorization': process.env.SIMPLY_READ_TOKEN
        }
    });
    return response.data.find(item => item.content?.name === process.env.INDICATOR_FIELD_NAME).id;
}

/**
 * Retrieves the list of members who have a SignOff field value
 * @returns {Promise<Array>} - Array of all members (no filtering needed)
 */
async function getMembers() {
    const response = await axios.get(`https://api.apparyllis.com/v1/members/${systemID}`, {
        headers: {
            'authorization': process.env.SIMPLY_READ_TOKEN
        }
    });

    return response.data; // Return all members, filtering done in updateEmojiList
}

/**
 * Initializes system by fetching and setting required IDs, member data, and front list
 */
async function initializeSystem() {
    systemID = await getSystemID();
    signOffID = await getSignOffID();
    allMembers = await getMembers();

    // Fetch initial front members
    const frontResponse = await axios.get('https://api.apparyllis.com/v1/fronters/', {
        headers: {
            'authorization': process.env.SIMPLY_READ_TOKEN
        }
    });

    frontList = frontResponse.data.map(item => item.content.member); // Update frontList with current members
    updateEmojiList(); // Run emoji list update
}

// Initialize system
initializeSystem();

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
            updateFront(parsed.results[0].content.member, parsed.results[0].content.live);
        }
    } catch (error) {
        // If an error occurs while parsing the WebSocket message, ignore it
    }
};

// WebSocket event handler for errors
socket.onerror = (error) => {
    console.error('WebSocket error:', error);
};

// WebSocket event handler for when the connection is closed
socket.onclose = () => {
    console.log('Connection closed');
};

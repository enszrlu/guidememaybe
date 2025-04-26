**Guide Me Maybe - MVP Specification Document**

**App Overview**

**Guide Me Maybe** is a mobile travel companion app that uses AI to guide users through nearby touristic landmarks with fun, informative summaries and voice narration. Users interact with an interactive map, click on markers to view highlights, and ask questions to an AI assistant to learn more about a location in their selected language.

**Tech Stack (MVP)**

**Frontend**

- React Native (with Expo)
- Expo Router for navigation and routing
- NativeWind for Tailwind CSS styling
- react-native-reusables (@rn-primitives) for UI component primitives (Shadcn UI for react native)
- react-native-maps for interactive maps
- expo-location for geolocation
- react-navigation for screen modals and navigation (used by Expo Router)
- react-native-voice or Expo Audio APIs for speech-to-text
- expo-av for voice playback

**Backend**

- Node.js (Express or Serverless via Vercel/Firebase)
- **OpenAI GPT-4 API for both text generation and audio synthesis (TTS)**
- Google Custom Search API or Serper.dev for real-time web content
- Supabase for database and backend services (e.g., storing place data)

**Step-by-Step User Journey (MVP)**

**Language Detection**

- On first app launch, detect the device's default system language
- Use this language to fetch summaries and generate audio
- Allow users to manually change language in settings
- Store user's preferred language choice locally (AsyncStorage or SecureStore)

**1\. App Opens → Map Centered on User's Location**

**Flow:**

- Request location permissions
- Fetch current coordinates
- Display user's position as a blue dot
- Fetch and render touristic locations nearby as markers

**Data structure for location markers:**

\[

{

"id": "location-001",

"name": "Big Ben",

"type": "Historic Landmark",

"lat": 51.5007,

"lng": -0.1246,

"thumbnailUrls": \[

"<https://example.com/thumb1.jpg>",

"<https://example.com/thumb2.jpg>"

\]

}

\]

**2\. User Taps on a Pin (Tourist Place Marker)**

**UI Behavior:**

- Slide-up preview card (on the same map screen):
  - 2–3 thumbnails
  - Location name
  - Short label/type (Castle, Museum, Historic Site)
  - "More Info" button

**3\. Taps "More Info" → Place Details Page**

**Audio Guide Selection**

- Users can select a version of the guide before listening:
  - "🎧 Brief Summary" (30–45 seconds, ~100–150 words)
  - "🎧 In-Depth Explanation" (1.5–2 minutes, ~300–400 words)
- This audio guide is always available on the details page, even before Q&A.
- The audio player UI includes:
  - Title of the selected version (e.g., "Brief Summary")
  - 🔊 Play / pause / replay controls
  - Switch to change between "Brief" and "In-Depth" versions

**Backend API Call Example for Audio Guide Versions:**

- GET /api/place-audio-guide?placeId=location-001&type=brief&lang=en from backend server.
- Server uses GPT-4 and OpenAI /v1/audio/speech with specific prompt:
Please generate a \[brief/in-depth\] spoken guide for \[PLACE_NAME\] in \[LANGUAGE\]. The tone should be informative, engaging, and appropriate for a mobile travel app.

- Server returns:
- {
- "summary": "Big Ben is a world-famous clock tower located in London...",
- "audio": "&lt;base64 or audio URL&gt;"

}

**UI Layout:**

- Modal or screen overlay with:
  - 📷 Full image gallery (carousel or scrollable)
  - 🧠 AI-generated summary (max 3 short paragraphs)
  - Predefined question buttons:
    - "What's the history of this place?"
    - "Is it open today?"
    - "Any cool facts?"
    - "Who built it?"
    - "What else is nearby?"
  - Text input and microphone icon for free-form questions

**Backend API Call Example:**

- GET /api/place-summary?placeId=location-001&lang=en
- The server will:
    1. Use the place name to query recent web data
    2. Pass a prompt to GPT-4:

Summarise recent and historical information about Big Ben in English. Include only facts that are verifiable from current reliable sources.

- 1. Translate if needed
  2. Use OpenAI's /v1/audio/speech API to generate an MP3 audio response of the summary
  3. Return a structured response:
  4. {
  5. "summary": "Big Ben, completed in 1859, is the nickname for the Great Bell in the Elizabeth Tower at the north end of the Palace of Westminster in London. It is one of the most prominent symbols of the United Kingdom...",
  6. "language": "en",
  7. "audio": "&lt;binary or base64 MP3 stream&gt;"

}

**4\. AI Responds with Text + Voice**

**Behavior:**

- Display response as a scrollable text block
- Embed a playable voice button:
  - TTS audio generated directly using OpenAI's TTS API
  - Voice options: alloy, echo, fable, onyx, nova, shimmer
- "🔊 Replay" and "👍 Was this helpful?" buttons under response

**5\. User Can Continue Exploring**

- Close modal
- Return to map
- Zoom/pan to view other locations

**Sample Predefined AI Questions per Location**

**Example: Tower of London**

- What's the history of this place?
- What famous events happened here?
- Who lived here?
- Why was it built?
- What can I do if I visit today?
- What are some nearby places to see?
- Tell me a fun or dark fact about this place

**Sample User Flow (Narrative)**

1. Alice opens the app in London → gives location permission
2. The map loads centered on Alice's GPS
3. She sees pins for "Tower of London," "Big Ben," and "The Shard"
4. She taps the "Tower of London" pin
5. A preview card slides up with 3 photos and a "More Info" button
6. Taps "More Info" → a modal opens:
    - Audio guide options load (Brief or In-Depth)
    - AI-generated summary loads
    - Alice selects "Brief Summary" and listens as she looks at the tower of london
    - Buttons like "What's the history?" are available
    - Alice taps "Any dark facts?" → AI responds
    - Audio autoplays, she listens while continuing her walk
7. She closes the modal → back to exploring on the map
# BlockSocial Documentation

## 1. User Scenario & Workflow (The Fork System)

### The Setup
* **User A**: Publishes a post saying: "I love drinking Pepsi every day."
* **User B**: Is shy, but wants to tell their friend this is an unhealthy habit.
* **User C**: Is a malicious user who gossips.

### The Fork Mechanism
User B creates a fork to discuss this post with User C via the `POST /api/share` endpoint.
* **Data Copying**: It copies the entire post contents except comments, likes, reports, and downloads.
* **Chain Prevention**: You can fork a forked post, but the system will fork the original source root, not the fork itself.
* **Scope**: It shares with only one user at a time to prevent unexpected group creation.

### Database Payload for Forks
The following fields are appended to the document structure:
```json
{
  "share": true,
  "shareId": "post._id", // The original post ID
  "sharedBy": "req.currentUser.username", // The user who shared or forked
  "shareTo": "shareTo", // The friend receiving the share
  "shareComment": "comment || ''" // A quick comment on the post
}
```

### Moderation & Enforcement Workflow
If User C breaks trust and leaks the conversation, User B can report them via the `POST /report/user` endpoint.

1. **Verification**: Administrators review interaction history to verify the violation.
2. **Account Termination**: Bad users receive a permanent lifetime account ban.
3. **Data Scrubbing**: All associated messages from the malicious user are removed.
4. **Blacklisting**: The account is fully banned.
5. **The Blindspot**: Face-to-face interactions remain outside system moderation boundaries 😅

---

## 2. Technical Implementation Details

### Dynamic Comment Identity Logic
When a user submits a comment via `POST /api/comment`, the application evaluates the `id` payload from `req.body` to locate the post and applies the following identity check:
```javascript
(result.anonymous && result.by === req.currentUser.username) ? result.anonymous_name : req.currentUser.username
```
* **Logic**: If it is an anonymous post and the author is commenting, the system displays their unique UUID (`result.anonymous_name`). Otherwise, it returns their standard username.

### API Data Masking (Anti-Data Leaking)
To prevent tech-savvy clients from using custom fetch functions to sniff the hidden `by` (author) field, the backend strips identifying data before serving payloads:
```javascript
posts.forEach(post => {
  if (post.anonymous) post.by = post.anonymous_name;
});
```
* **Security**: The true author identity is replaced with the anonymous UUID payload on the fly. This ensures raw creator data remains accessible exclusively to administrators for moderation purposes.
* **Optimization**: This uses `.lean()` to fetch plain JavaScript objects directly, bypassing heavy Mongoose documents and preventing accidental database writes.
 
### Performance Optimization
* **Pagination Constraints**: Payloads are strictly limited to 50 posts per request cycle.
* **Navigation**: Client-side navigation relies on next/previous pagination states to ensure low latency and high speed.

---

## 3. Core Feature Matrix

### Posting & Filtering
* **Posting Options**: Supports anonymous publishing or making a post private (visible only to you).
* **Interactions**: Native support for likes, reports, convert posts to image, comments, and forks.
* **Collections**: Custom user collections featuring full CRUD support (Create, Read, Update, Delete).
* **Advanced Filters**: Filter posts by text/image content, forks, and creator.
* **Reels Filter**: Video filtering sorted by content creator profiles.

### Data Portability
* **Export Posts Data**: Download post history in JSONL format (Minimum 15 post, Maximum 300 post, if you have less than 15, just type 15 and it will get what it can find).
* **Import Posts Data**:  Upload Bulk posts (Each post **MUST** not already exist on the platform, or it will be skipped).

### User & Social Tools
* **Search Infrastructure**: Indexed query lookups for system users and connections.
* **Profile Customization**: Access to a curated matrix of custom emojis:
`😎 🌸 👧🏿 👦🏿 🐑 🐣 🐔 🧆 🥚 👩🏿 👨🏿 🍳 🥒 🚗 👮 👮‍♀️ 🕵️‍♀️ 🎅 🤶 ✨ 🎉 🎊 🎀 🎥 🍔 👨🏻 👳🏻‍♂️ 👳🏻‍♀️ 👩🏻‍🦱 😂`
* **Post Management**: Full content editing and deletion capabilities.
* **Image Editor**: Integrated image editor for post attachments.

### Security & Account Lifecycle
* **Password Recovery**: Time-limited recovery codes featuring manual administrative revocation.
* **Delete Account**: Complete account purging removes user metadata while converting active public records into anonymous "ghost posts."
* **UI Themes**: Dark and light mode styling toggles.
* **Support Engine**: Live-chat support desks powered by the tawk.to API wrapper and docs.

---

## 4. Getting Started

## Project Structure
* `/private` - Administrative authentication dashboards
* `/public` - Client-side presentation layer and assets
* `/` - Core application architecture and server routing logic

### Prerequisites
- Node.js v16+
- MongoDB (Local instance or Atlas cluster)
- npm package manager

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Hfs2024/BlockSocial/
   ```
2. Navigate to the project root:
   ```bash
   cd BlockSocial
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Configure your environment variables in a `.env` file:
   ```env
   MONGO_URI=your_mongodb_connection_string
   ADMIN_PASSWORD=your_hashed_password
   ADMIN_USERNAME=your_admin_username
   SESSION_SECRET=your_secure_session_secret
   ```
5. Initialize the server application:
   ```bash
   node server.js
   ```

*Contributions, bug reports, and repository stars are highly appreciated.*

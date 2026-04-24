# Church OS Deployment Protocol

Follow these steps to deploy and install the Church Management ERP on a local server or computer.

## 1. Prerequisites
- **Node.js** (v18 or higher)
- **NPM** (v9 or higher)

## 2. Installation Steps
1. **Clone/Download** the source code to your machine.
2. **Open Terminal** in the project directory.
3. **Install Dependencies**:
   ```bash
   npm install
   ```
4. **Environment Configuration**:
   - Create a `.env` file in the root.
   - Add a `JWT_SECRET` for encryption (e.g., `JWT_SECRET=your-secure-hash`).
5. **Build Development Bundle**:
   ```bash
   npm run build
   ```

## 3. Launching the System
To start the production-ready server:
```bash
npm run start
```
The system will be available at `http://localhost:3000`.

## 4. First-Time Setup
On your first visit, the **Deployment Wizard** will activate. You will be required to provide:
- **Organization Name**: The legal name of your ministry.
- **Admin Identity**: Creating the root Super-Administrator account.
- **Master Secret Key**: The password for the root account.

## 5. Persistence
All data is stored in the `church.db` file (SQLite). **Backup this file daily.**
To migrate to a new computer, simply move the folder and the `church.db` file.

---
**Security Notice**: Unauthorized access to the terminal hosting this server compromises the entire ministry database. Ensure the host computer is physically and digitally secured.

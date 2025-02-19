import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import { join, dirname } from 'path'
import { ipcRenderer } from 'electron' 
import * as fs from 'fs'
let db: any = null

/* This will init a DB depending if you're running Dev or Production is where the sqllite db file will be geberated */
/* all your logic for DB amnipulation will be done in here and then imported into your preload to sue in your applicaiton */

export const initializeDB = async () => {
  const isDev = await ipcRenderer.invoke('is-dev')
  let dbPath: string = await ipcRenderer.invoke('get-user-path');
  console.log('isDev:', isDev)
  
  // Check if in development mode
  if (isDev) {
    dbPath = join(__dirname, '../../src/db/merkaba.db'); // Adjust this path according to your project structure
    console.log('Using development database path:', dbPath);
  } else {
    // For production, get the user data path asynchronously
    const userDataPath = await ipcRenderer.invoke('get-user-path'); // For renderer process
    // or if in main process:
    // const userDataPath = getUserPathMain();
    dbPath = join(userDataPath, './db/project.db');
    console.log('Using production database path:', dbPath);
  }
  
    // Ensure the directory exists
    const dir = dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true }); // Create the directory with all intermediate directories
    }

  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, '')
    console.log('Created merkaba.db because it was not found.')
  } else {
    console.log('merkaba.db already exists.')
  }
  try {
    fs.accessSync(
      dbPath,
      fs.constants.R_OK | fs.constants.W_OK
    )
    console.log('Database file is accessible')
  } catch (err) {
    console.error('Database file is not accessible:', err)
    // Handle error, perhaps by creating the file or informing the user
  }

  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    })
    db.configure('busyTimeout', 5000)
    db.exec('PRAGMA foreign_keys = ON')
    db.exec('PRAGMA journal_mode = WAL')
    console.log('Database connection established.')
    return db
  } catch (error) {
    console.error('DB error con:', error)
    // process.exit(1) // Exit with an error code if DB connection fails at startup
  }

}

/* example function how to setup a new table and columns */
export const setupNewTables = async () => {
  const db = await initializeDB()
  
  const newColumns = `
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  column1 TEXT NOT NULL,
  column2 TEXT NOT NULL,
  walletName TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (walletId)`

  const SQLCreateTBL = `CREATE TABLE IF NOT EXISTS newTable ( ${newColumns} )`

  try {
    await db.run(SQLCreateTBL)
    await db.close()
    return null
  } catch (error) {
    console.error('Error creating tables:', error)
    await db.close()
    return 'error'
    // process.exit(1)
  }
}

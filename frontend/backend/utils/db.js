/*import { Low } from "lowdb"
import { JSONFile } from "lowdb/node"
import { join } from "path"

// file path for JSON database

const file = join(process.cwd(), "db.json")
const adapter = new JSONFile(file)
const db = new Low(adapter, { helpRequests: [], knowledgeBase: {} })


// read data before use
await db.read()
await db.write()

export default db
*/
import { db } from "./firebase.js";


await db.collection("helpRequests").doc(request.id).set(request);

export default db;


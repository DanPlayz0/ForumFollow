module.exports = class DatabaseManager {
  constructor(client) {
    this.client = client;
    this.raw = null;
    this.db = null;
  }

  async init() {
    if(!this.client.config.mongo_uri) throw Error('Missing Mongo URI');
    this.raw = await this.client.pkg.mongoDb.MongoClient.connect(this.client.config.mongo_uri, {}).catch(err => (console.error(err), null));
    const urlTokens = /\w\/([^?]*)/g.exec(this.client.config.mongo_uri)
    if(!urlTokens) throw Error('Missing Table Name');
    this.db = this.raw.db(urlTokens && urlTokens[1]);
    return true;
  }

  insertOne(collection, ...args) { return this.db.collection(collection).insertOne(...args); }
  
  updateOne(collection, ...args) { return this.db.collection(collection).updateOne(...args); }

  find(collection, ...args) { return this.db.collection(collection).find(...args)?.toArray(); }
  findOne(collection, ...args) { return this.db.collection(collection).findOne(...args); }

  deleteOne(collection, ...args) { return this.db.collection(collection).deleteOne(...args); }

}
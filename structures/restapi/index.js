const cookieParser = require('cookie-parser'), express = require('express'), cors = require('cors');

module.exports = class RestAPI {
  constructor(client) {
    this.client = client;

    // Web Server
    this.express = express();
    this.express.use(async (req,res,next) => { req.client = this.client; next(); })
    this.express.use(cookieParser());
    this.express.use(express.json());
    this.express.use(express.urlencoded({extended: true}));
    this.express.use(cors({ origin: this.client.config.domain, credentials: true }))
    // this.express.use(express.static(__dirname + "/../public"));
    this.express.disable('x-powered-by');

    this.loadRoutes().loadErrorHandler();
  }

  listen(port) {
    var server = this.express.listen(port);
    return server;
  }

  loadRoutes() {
    this.express.use("/v1", require(`@structures/restapi/v1/index.js`));
    return this;
  }

  loadErrorHandler() {
    this.express.use((error, _req, res, _next) => {
      const { message, statusCode = 500 } = error;
      if (statusCode >= 500) console.error(error);
      
      if(_req.accepts("json")) res.status(statusCode).send({ message, status: statusCode });
      res.type("txt").send(`${statusCode} - ${message}`);
    });

    this.express.use((_req, res, _next) => {
      if(_req.accepts("json")) return res.send({ status: 404, error: "Not found" });
      res.type("txt").send("404 - Not found");
    });

    return this;
  }
}
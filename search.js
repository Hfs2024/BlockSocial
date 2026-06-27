const express = require("express");
const path = require("path");
const router = express.Router();

router.get("/", (req, res) => {
   return res.sendFile(path.join(__dirname, "public/search/search.html"));
});

router.get("/:route", (req, res) => {
   const route = req.params.route;
   if (route === "users")
      return res.sendFile(path.join(__dirname, "public/search/search-users.html"));
   else if (route === "posts")
      return res.sendFile(path.join(__dirname, "public/search/search-posts.html"));
});

module.exports = {
   router
};
// Requiring our models and passport as we've configured it
const db = require("../models");
const passport = require("../config/passport");
// const favorite = require("../models/favorite");

module.exports = function(app) {
  // Using the passport.authenticate middleware with our local strategy.
  // If the user has valid login credentials, send them to the members page.
  // Otherwise the user will be sent an error
  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    // Sending back a password, even a hashed password, isn't a good idea
    res.json({
      email: req.user.email,
      id: req.user.id
    });
  });

  // Route for signing up a user. The user's password is automatically hashed and stored securely thanks to
  // how we configured our Sequelize User Model. If the user is created successfully, proceed to log the user in,
  // otherwise send back an error
  app.post("/api/signup", (req, res) => {
    db.User.create({
      email: req.body.email,
      password: req.body.password
    })
      .then(() => {
        res.redirect(307, "/api/login");
      })
      .catch(err => {
        res.status(401).json(err);
      });
  });

  // Route for logging user out
  app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
  });

  // Route for getting some data about our user to be used client side
  app.get("/api/user_data", (req, res) => {
    if (!req.user) {
      // The user is not logged in, send back an empty object
      res.json({});
    } else {
      // Otherwise send back the user's email and id
      // Sending back a password, even a hashed password, isn't a good idea
      res.json({
        email: req.user.email,
        id: req.user.id
      });
    }
  });
  // Route that gets all favorites from database
  // need to amend to ensure it works on a per user basis
  //---------------------------------------------------
  // TEST WORK
  //---------------------------------------------------
  app.post("/api/favorites", (req, res) => {
    if (req.user) {
      db.Favorite.findOrCreate({
        where: {
          name: req.body.name,
          location: req.body.location,
          phone: req.body.phone,
          website: req.body.website
          // latitude: req.body.latitude,
          // longitude: req.body.longitude
        }
      })
        .then(data => {
          const favorite_id = (data[0].dataValues.id);  // eslint-disable-line

          db.UserFavorite.findOrCreate({
            where: {
              favorite_id: favorite_id, // eslint-disable-line
              user_id: req.user.id  // eslint-disable-line
            }
            // code that checks if a row was added, then says "brewery already in favorites" if not
          }).then(() => {
            // if (res.rowsAffected() === 0) {
            //   return res.end("already in favorites!");
            // }
            return res.end("Added Favorite to Profile");
          });
        })
        // res.end("added brewery to favorites!");
        .catch(err => {
          console.log(err);
          res.status(401).json(err);
          // ^^^ don't know if this is the correct status code
        });
    } else {
      return res.end("Please login/sign up to save brewery favorites");
    }
  });

  app.get("/api/favorites", (req, res) => {
    if (!req.user) {
      res.json({});
    } else {
      db.user_favorite
        .findAll({
          where: {
            id: req.user.id
          }
        })
        .then(newFav => {
          res.json(newFav);
        });
    }
  });

  // ^^^ end of test
  // =========================================================
  app.get("/api/user_favorite/view", (req, res) => {
    // app.post("/api/user_favorite/view", (req, res) => {          // dev for postman testing
    db.User.findAll({
      attributes: ["id", "email", "createdAt", "updatedAt"],
      where: {
        id: req.user.id
        // id: req.body.id                // dev for postman testing
      },
      include: db.Favorite
    }).then(data => {
      res.json(data[0].Favorites);
    });
  });

  // app.destroy TEST WORK
  // ===============================
  app.delete("/api/favorites/:id", (req, res) => {
    console.log(req.params.id, "deleting");
    db.UserFavorite.destroy({
      where: {
        favorite_id: req.params.id, // eslint-disable-line 
        // params could be user input via submit button, correct?
        user_id: req.user.id // eslint-disable-line
      }
    }).then(() => {
      res.end("brewery deleted from favorites");
    });
  });
};

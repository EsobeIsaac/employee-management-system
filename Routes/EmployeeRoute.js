import express from 'express'
import con from "../utils/db.js";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt'

const router = express.Router()

router.post("/employee_login", (req, res) => {
    const sql = "SELECT * from employee Where email = ?";
    con.query(sql, [req.body.email], (err, result) => {
      if (err) return res.json({ loginStatus: false, Error: "Query error" });
      if (result.length > 0) {
        bcrypt.compare(req.body.password, result[0].password, (err, response) => {
            if (err) return res.json({ loginStatus: false, Error: "Wrong Password" });
            if(response) {
                const email = result[0].email;
                const token = jwt.sign(
                    { role: "employee", email: email, id: result[0].id },
                    "jwt_secret_key",
                    { expiresIn: "1d" }
                );
                res.cookie('token', token)
                return res.json({ loginStatus: true, id: result[0].id });
            }
        })
        
      } else {
          return res.json({ loginStatus: false, Error:"wrong email or password" });
      }
    });
  });

  router.get('/detail/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM employee where id = ?"
    con.query(sql, [id], async(err, result) => {
        if(err) return res.json({Status: false});

        let resultArray = [...result]

                // Convert con.query to return a promise
        const queryPromise = (query, params) => {
          return new Promise((resolve, reject) => {
            con.query(query, params, (err, result) => {
              if (err) {
                return reject(err);
              }
              resolve(result);
            });
          });
        };

        const mapCategoriesToResultArray = async () => {
          try {
            const resultWithCategory = await Promise.all(
              resultArray.map(async (item) => {
                // Perform the query for each item
                const category = await queryPromise("SELECT * FROM CATEGORY WHERE id = ?", [item.category_id] | "1");
                
                if (category.length > 0) {
                  item.category_name = category[0].name; // Assign the category name
                } else {
                  item.category_name = 'Unknown'; // In case no category is found
                }
                
                return item;
              })
            );

            // After all queries have completed, send the final array as response
            return res.json(resultWithCategory);
          } catch (err) {
            return res.json({ Status: false, Error: "Query Error" });
          }
        };

        mapCategoriesToResultArray();
    })
  })

  router.get('/logout', (req, res) => {
    res.clearCookie('token')
    return res.json({Status: true})
  })

  export {router as EmployeeRouter}
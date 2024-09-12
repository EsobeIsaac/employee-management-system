import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt'
import multer from "multer";
import cloudinary from 'cloudinary';

import con from "../utils/db.js";
import path from "path";
import dotenv from "dotenv";

dotenv.config({path: './config.env'});
import cloudinaryUpload from '../modules/cloudinaryUpload.js';

const router = express.Router();

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

router.post("/adminlogin", (req, res) => {
  const sql = "SELECT * from admin Where email = ? and password = ?";
  con.query(sql, [req.body.email, req.body.password], (err, result) => {
    if (err) {
        console.log(err)
        return res.json({ loginStatus: false, Error: "Query error" })
    };
    if (result.length > 0) {
      const email = result[0].email;
      const token = jwt.sign(
        { role: "admin", email: email, id: result[0].id },
        "jwt_secret_key",
        { expiresIn: "1d" }
      );
      res.cookie('token', token)
      return res.json({ loginStatus: true });
    } else {
        return res.json({ loginStatus: false, Error:"wrong email or password" });
    }
  });
});

router.get('/category', (req, res) => {
    const sql = "SELECT * FROM category";
    con.query(sql, (err, result) => {
        if(err) {
            console.log(err)
            return res.json({Status: false, Error: "Query Error"})
        }
        return res.json({Status: true, Result: result})
    })
})

router.post('/add_category', (req, res) => {
    const sql = "INSERT INTO category (`name`) VALUES (?)"
    con.query(sql, [req.body.category], (err, result) => {
        if(err) {
            console.log(err)
            return res.json({Status: false, Error: "Query Error"})
        }
        return res.json({Status: true})
    })
})


  
  const upload = multer();
// end imag eupload 

router.post('/add_employee', upload.single('image'), (req, res) => {
    const sql = `INSERT INTO employee 
    (name, email, dob, password, address, salary, image, category_id) 
    VALUES (?)`;

    // Check if the email already exists
    con.query("SELECT * FROM employee WHERE email = ?", [req.body.email], (err, result) => {
        if (err) {
            return res.json({ Status: false, Error: "Something went wrong, try again" });
        }

        // If user with this email exists, send error response and return
        if (result[0]) {
            return res.json({ Status: false, Error: "User with this email already exists" });
        }

        // If the email does not exist, proceed with employee creation
        bcrypt.hash(req.body.password, 10, async (err, hash) => {
            if (err) return res.json({ Status: false, Error: "Hashing Error" });

            try {
                // Upload the image to Cloudinary
                let imageUrl

                if(req.file?.buffer) {
                    let result = await cloudinaryUpload(req.file.buffer);
                    imageUrl = result.secure_url;

                }

                // Image upload successful, get the Cloudinary URL

                const values = [
                    req.body.name,
                    req.body.email,
                    req.body.dob,
                    hash,
                    req.body.address,
                    req.body.salary,
                    imageUrl ? imageUrl : 'https://res.cloudinary.com/dhguwu00q/image/upload/v1725940438/tzp02l5ppbkjykn0akgv.png',  // Use the Cloudinary URL here
                    req.body.category_id
                ];

                // Insert the employee data including the image URL into MySQL
                con.query(sql, [values], (err, result) => {
                    if (err) {
                        console.log(err);
                        return res.json({ Status: false, Error: "Database Error" });
                    }
                    return res.json({ Status: true });
                });

            } catch (uploadError) {
                console.log(uploadError);
                return res.json({ Status: false, Error: "Image Upload Error" });
            }
        });
    });
});


router.get('/employee', (req, res) => {
    const sql = "SELECT * FROM employee";
    con.query(sql, (err, result) => {
        if(err) {
            console.log(err)
            return res.json({Status: false, Error: "Query Error"})
        }
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
                    const category = await queryPromise("SELECT * FROM category WHERE id = ?", [item.category_id]);
                    
                    if (category.length > 0) {
                    item.category_name = category[0].name; // Assign the category name
                    } else {
                    item.category_name = 'Unknown'; // In case no category is found
                    }
                    
                    return item;
                })
                );

                // After all queries have completed, send the final array as response
                return res.json({Status: true, Result: resultWithCategory});
            } catch (err) {
                console.log(err)
                return res.json({Status: false, Error: "Query Error"}) 
            }
            };

            mapCategoriesToResultArray();
        // return res.json({Status: true, Result: result})
    })
})

router.get('/employee/:id', (req, res) => {
    console.log(req.params.id)
    const id = req.params.id;
    const sql = "SELECT * FROM employee WHERE id = ?";
    con.query(sql,[id], (err, result) => {
        if(err) return res.json({Status: false, Error: "Query Error"})
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
                    const category = await queryPromise("SELECT * FROM category WHERE id = ?", [item.category_id] | "1");
                    
                    if (category.length > 0) {
                    item.category_name = category[0].name; // Assign the category name
                    } else {
                    item.category_name = 'Unknown'; // In case no category is found
                    }
                    
                    return item;
                })
                );

                // After all queries have completed, send the final array as response
                return res.json({Status: true, Result: resultWithCategory});
            } catch (err) {
                return res.json({ Status: false, Error: "Query Error" });
            }
            };

            mapCategoriesToResultArray();
        // con.query("SELECT * FROM CATEGOTY WHERE id = ?",1, (err, result) => {
        //     if(err) return res.json({Status: false, Error: "Query Error"})
        //     console.log(result)
        //     return res.json({Status: true, Result: result})
        // })
    })
})

router.put('/edit_employee/:id', upload.single('image'), async(req, res) => {
    const id = req.params.id;
    const sql = `UPDATE employee 
        set name = ?, email = ?, salary = ?, address = ?, category_id = ?, image = ? 
        Where id = ?`

    

    con.query(`SELECT * FROM employee WHERE id = ?`,[id], async(err, result) => {
        console.log(err)
        if(err) return res.json({Status: false, Error: "Error"+err})
        console.log(result)
        let employee = result[0]
        let imageUrl;

        if(req.file?.buffer) {
            let imageRes = await cloudinaryUpload(req.file.buffer);
            imageUrl = imageRes.secure_url;
        }

        const values = [
            req.body.name,
            req.body.email,
            req.body.salary,
            req.body.address,
            req.body.category_id,
            imageUrl ? imageUrl : employee.image,
        ]
        con.query(sql,[...values, id], (err, result) => {
            console.log(err)
            if(err) return res.json({Status: false, Error: "Query Error"+err})
            return res.json({Status: true, Result: result})
        })
    })

    
})

router.delete('/delete_employee/:id', (req, res) => {
    const id = req.params.id;
    const sql = "delete from employee where id = ?"
    con.query(sql,[id], (err, result) => {
        if(err) return res.json({Status: false, Error: "Query Error"+err})
        return res.json({Status: true, Result: result})
    })
})

router.get('/admin_count', (req, res) => {
    const sql = "select count(id) as admin from admin";
    con.query(sql, (err, result) => {
        if(err) return res.json({Status: false, Error: "Query Error"+err})
        return res.json({Status: true, Result: result})
    })
})

router.get('/employee_count', (req, res) => {
    const sql = "select count(id) as employee from employee";
    con.query(sql, (err, result) => {
        if(err) return res.json({Status: false, Error: "Query Error"+err})
        return res.json({Status: true, Result: result})
    })
})

router.get('/salary_count', (req, res) => {
    const sql = "select sum(salary) as salaryOFEmp from employee";
    con.query(sql, (err, result) => {
        if(err) return res.json({Status: false, Error: "Query Error"+err})
        return res.json({Status: true, Result: result})
    })
})

router.get('/admin_records', (req, res) => {
    const sql = "select * from admin"
    con.query(sql, (err, result) => {
        if(err) return res.json({Status: false, Error: "Query Error"+err})
        return res.json({Status: true, Result: result})
    })
})

router.get('/logout', (req, res) => {
    res.clearCookie('token')
    return res.json({Status: true})
})

export { router as adminRouter };

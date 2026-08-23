import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import connection from "./Database.js";


dotenv.config();

const app = express();
const port = 8001;

app.use(cors());
app.use(express.json());

app.listen(port, () => console.log(`App listening on port ${port}!`));

// routes

app.get("/api/selectuser/:accno", (req, res) => {
  const accno = req.params.accno;

  connection.query(
    "SELECT * FROM card WHERE accno = ?",
    [accno],
    (error, results) => {
      if (error) {
        console.error("Error executing query:", error);
        res.status(500).json({ error: "An error occurred" });
      } else {
        res.json(results);
      }
    }
  );
});

app.post("/api/create-account", (req, res) => {
  const { accno, name, pin, balance = 0 } = req.body;
  const accountNumber = Number(accno);
  const openingBalance = Number(balance);

  if (!Number.isInteger(accountNumber) || accountNumber <= 0 || !name || !/^\d{4}$/.test(String(pin))) {
    return res.status(400).json({ error: "Enter a valid account number, name, and 4-digit PIN" });
  }

  if (!Number.isFinite(openingBalance) || openingBalance < 0) {
    return res.status(400).json({ error: "Opening balance must be zero or more" });
  }

  connection.beginTransaction((transactionError) => {
    if (transactionError) {
      return res.status(500).json({ error: "Unable to start account creation" });
    }

    connection.query(
      "INSERT INTO `User` (accno, name) VALUES (?, ?)",
      [accountNumber, name.trim()],
      (userError) => {
        if (userError) {
          return connection.rollback(() => {
            res.status(userError.code === "ER_DUP_ENTRY" ? 409 : 500).json({
              error: userError.code === "ER_DUP_ENTRY" ? "Account number already exists" : "Unable to create account",
            });
          });
        }

        connection.query(
          "INSERT INTO `Card` (cardno, accno, acctype, name_card, pin, bankname, expiredate, cvv, balance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [accountNumber, accountNumber, "Savings", name.trim(), String(pin), "KCT Bankers", "2030-12-31", 0, openingBalance],
          (cardError) => {
            if (cardError) {
              return connection.rollback(() => {
                res.status(500).json({ error: "Unable to create card" });
              });
            }

            connection.commit((commitError) => {
              if (commitError) {
                return connection.rollback(() => {
                  res.status(500).json({ error: "Unable to save account" });
                });
              }

              res.status(201).json({ message: "Account created successfully" });
            });
          }
        );
      }
    );
  });
});

app.post("/api/withdraw/:accno", (req, res) => {
  const accno = req.params.accno;
  const amt = req.body.amt;

  connection.query(
    "SELECT balance, cardno FROM card WHERE accno = ?",
    [accno],
    (error, results) => {
      if (error) {
        console.error("Error executing query:", error);
        res.status(500).json({ error: "An error occurred" });
      } else {
        if (results.length > 0) {
          const balance = results[0].balance;
          const cardno = results[0].cardno;
          if (balance >= amt) {
            connection.beginTransaction((err) => {
              if (err) {
                console.error("Error starting transaction:", err);
                res.status(500).json({ error: "An error occurred" });
                return;
              }

              connection.query(
                "UPDATE card SET balance = balance - ? WHERE accno = ?",
                [amt, accno],
                (error, results) => {
                  if (error) {
                    console.error("Error executing query:", error);
                    connection.rollback(() => {
                      res.status(500).json({ error: "An error occurred" });
                    });
                  } else {
                    connection.query(
                      "INSERT INTO transaction (cardno, transtype, amt, date, time) VALUES (?, ?, ?, CURDATE(), CURTIME())",
                      [cardno, "withdraw", amt],
                      (error, results) => {
                        if (error) {
                          console.error("Error executing query:", error);
                          connection.rollback(() => {
                            res
                              .status(500)
                              .json({ error: "An error occurred" });
                          });
                        } else {
                          connection.commit((err) => {
                            if (err) {
                              console.error(
                                "Error committing transaction:",
                                err
                              );
                              connection.rollback(() => {
                                res
                                  .status(500)
                                  .json({ error: "An error occurred" });
                              });
                            } else {
                              console.log("Withdrawal successful");
                              res
                                .status(200)
                                .json({ message: "Withdrawal successful" });
                            }
                          });
                        }
                      }
                    );
                  }
                }
              );
            });
          } else {
            res.status(400).json({ error: "Insufficient balance" });
          }
        } else {
          res.status(404).json({ error: "Account not found" });
        }
      }
    }
  );
});

app.post("/api/deposit/:accno", (req, res) => {
  const accno = req.params.accno;
  const amount = req.body.amount;

  connection.query(
    "SELECT * FROM card WHERE accno = ?",
    [accno],
    (error, results) => {
      if (error) {
        console.error("Error executing query:", error);
        res.status(500).json({ error: "An error occurred" });
      } else {
        if (results.length > 0) {
          const balance = results[0].balance;
          const cardno = results[0].cardno;
          if (amount > 0) {
            connection.beginTransaction((err) => {
              if (err) {
                console.error("Error starting transaction:", err);
                res.status(500).json({ error: "An error occurred" });
                return;
              }

              connection.query(
                "UPDATE card SET balance = balance + ? WHERE accno = ?",
                [amount, accno],
                (error, results) => {
                  if (error) {
                    console.error("Error executing query:", error);
                    connection.rollback(() => {
                      res.status(500).json({ error: "An error occurred" });
                    });
                  } else {
                    connection.query(
                      "INSERT INTO transaction (cardno, transtype, amt, date, time) VALUES (?, ?, ?, CURDATE(), CURTIME())",
                      [cardno, "deposit", amount],
                      (error, results) => {
                        if (error) {
                          console.error("Error executing query:", error);
                          connection.rollback(() => {
                            res
                              .status(500)
                              .json({ error: "An error occurred" });
                          });
                        } else {
                          connection.commit((err) => {
                            if (err) {
                              console.error(
                                "Error committing transaction:",
                                err
                              );
                              connection.rollback(() => {
                                res
                                  .status(500)
                                  .json({ error: "An error occurred" });
                              });
                            } else {
                              console.log("Deposit successful");
                              res
                                .status(200)
                                .json({ message: "Deposit successful" });
                            }
                          });
                        }
                      }
                    );
                  }
                }
              );
            });
          } else {
            res.status(400).json({ error: "Enter the amount" });
          }
        } else {
          res.status(404).json({ error: "Account not found" });
        }
      }
    }
  );
});

app.get("/api/transaction/:accno", (req, res) => {
  const accno = req.params.accno;

  connection.query(
    "SELECT transtype, amt , date, time FROM transaction, card WHERE accno = ? && card.cardno = transaction.cardno ORDER BY date DESC, time DESC limit 10",
    [accno],
    (error, results) => {
      if (error) {
        console.error("Error executing query:", error);
        res.status(500).json({ error: "An error occurred" });
      } else {
        res.json(results);
      }
    }
  );
});

import express from "express";
import pg from "pg"; 

const db = new pg.Client({
  user:'postgres',
  password:'password',
  host:'localhost',
  port:5432,
  database:'readrecall'
})
db.connect();

const port = 3000;
const app = express();


let books = [];

app.use(express.static("public"))
app.use(express.urlencoded({ extended: true }));

async function getBooks(){
  const data = await db.query("SELECT * FROM books");
  books = data.rows;
}

getBooks();


app.get("/",async (req,res)=>{
  await getBooks();
    res.render("index.ejs",{
        books
    })
})

app.get("/sortbytitle",async(req,res)=>{
  const data = await db.query("SELECT * FROM books ORDER BY title ASC");
  books = data.rows;
  res.render("index.ejs",{
    books
})
})

app.get("/add",(req,res)=>{
    res.render("add.ejs")
})

app.post("/add",async (req,res)=>{
  const result = await db.query("INSERT INTO books (isbn,title,author,description,rating,date) VALUES($1,$2,$3,$4,$5,$6) RETURNING book_id",
  [req.body.isbn,req.body.title,req.body.author,req.body.discription,req.body.rating,req.body.date]);
  console.log(result.rows);
  const bookId = result.rows[0].book_id;

  await db.query("INSERT INTO book_notes (book_id) VALUES ($1)",[bookId]);
  res.redirect("/")
})

app.get("/book/:id",async(req,res)=>{
  const result = await db.query("SELECT books.book_id,isbn,title,author,description,notes FROM books JOIN book_notes ON books.book_id=book_notes.book_id WHERE books.book_id=$1",[req.params.id])
  const book = result.rows[0]
  res.render("book.ejs",
  {
    book
  })
})

app.post("/addnotes",async(req,res)=>{
  await db.query("UPDATE book_notes SET notes=$1 WHERE book_id=$2;",[req.body.notes,req.body.id])
  res.redirect(`/book/${req.body.id}`)
})


app.listen(port,()=>{
    console.log(`Application is running at http://localhost:${port}`)
})
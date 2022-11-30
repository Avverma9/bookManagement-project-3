const userModel = require("../controller/userController");
//const reviewModel = require("../controller/reviewController");
const bookModel = require("../models/bookModel");
const reviewModel = require("../models/reviewModel");

const {valid,validISBN,validReleasedAt} = require("../validator/validation");

const { isValidObjectId } = require("mongoose");
//==================================================bookCreation==========================================================//
const createBook = async function (req,res){
    try{
        const data = req.body
        const{title,excerpt,userId,ISBN,category,subcategory,releasedAt} = data
        if(Object.keys(data)==0){ return res.status(400).send({ status : false, msg : 'Please provide data'})}

        if(!valid(title)){ return res.status(400).send({ status : true, msg :"title is required"})}

//===checking if title is already created===
        const duplicateTitle = await bookModel.findOne({title :title})
        if (duplicateTitle) { return res.status(400).send({ status : false, msg : "title is already registered"})}

        if(!valid(excerpt)){ return res.status(400).send({status: false , msg : "excerpt is required"})}

        if(!valid(userId)){return res.status(400).send({ status : false, msg : "Please enter the user Id"})}
        if(!isValidObjectId(userId)){ return res.status(400).send({status : false, msg : " it's not a valid user Id"})}

        if(!valid(ISBN)){ return res.status(400).send({ status : false , msg : " Please enter ISBN number"})}
        if(!validISBN(ISBN)){ return res.status(400).send({ status : false , msg : " Please Enter the Valid ISBN"})}

        const duplicateISBN = await bookModel.findOne({ISBN : ISBN})
        if (duplicateISBN) { return res.status(400).send({ status : false, msg : "ISBN is already available"})}

        if(!valid(category)){ return res.status(400).send({status: false , msg : "category is required"})}

        if(!valid(subcategory)){ return res.status(400).send({status: false , msg : "subcatogory is required"})}

        if(!validReleasedAt(releasedAt)){ return res.status(400).send({status : false, msg : "release date should be in valid format"})}
    
        const newBookData = await bookModel.create(data)
        return res.status(201).send({ status : true , data : newBookData})
    }
 catch(err){
    console.log(err)
    return res.status(500).send({ message : err.message})
 }
}
//===========================================getting books by query param===================================================//
const getBooks = async function(req,res){
    try{
         const data = req.query;
         const{userId,category,subcategory} = data
         const filterData = {isDeleted:false}
        if (Object.keys(data).length == 0) {
            let getAllBooks = await bookModel.find(filterData).sort({ title: 1 }).select({_id:1, title:1, excerpt:1, userId:1, category:1, subcategory:1, releasedAt:1, reviews:1})
            return res.status(200).send({ status: true, message: 'Books list', data: getAllBooks })
        }
        if (userId) {
            let isValidId = mongoose.Types.ObjectId.isValid(userId)
            if (!isValidId) {
                return res.status(400).send({ status: false, message: "Enter valid user id" })
            }
             filterData.userId = userId
        }
        if (category) {
            filterData.category = category
        }
        if (subcategory) {
            filterData.subcategory = subcategory
        }
        let books = await bookModel.find(filterData).sort({ title: 1 }).select({_id:1, title:1, excerpt:1, userId:1, category:1, subcategory:1, releasedAt:1, reviews:1})
        if (books.length == 0) {
            return res.status(404).send({ status: false, message: "No data found" })
        }
            return res.status(200).send({ status: true, message: 'Books list', data: books })
        
    }
    catch(err){
        console.log(err)
    return res.status(500).send({status:false, message : err.message})
    }
}
//.......................................getBookByPathParam.............................................
const getBookByParams = async function(req,res){
  try{
        const data = req.params.bookId

        if(!valid(data)){
            return res.status(400).send({status:false,message:"Please provide BookId in Params"})
        }
        let isValidId =isValidObjectId(data)
        if (!isValidId) {
            return res.status(400).send({ status: false, message: "Enter valid book id" })
        }

      const findBook = await bookModel.findOne({_id: data, isDeleted: false }).select({ISBN:0,__v:0});
      if(!findBook){
        return res.status(404).send({status:false,message:"Book not found"})
      }

      const findReviewData = await reviewModel.find({bookId:data},{isDeleted:false}).select({bookId : 1, reviewedBy : 1 , rating : 1 , review : 1})

      let getDetail ={
        _id:findBook._id,
        title:findBook.title,
        excerpt:findBook.excerpt,
        userId:findBook.userId,
        category:findBook.category,
        subcategory:findBook.subcategory,
        isDeleted:findBook.isDeleted,
        reviews:findBook.reviews,
        releasedAt:findBook.releasedAt,
        reviewsData:findReviewData

      }
      return res.status(200).send({status:false,message:"Book list",data:getDetail})

  }
  catch(err){
    console.log(err)
    return res.status(500).send({status:false,message:err.message})
  }
}


//===================================update books===========================================================//
const updateBooks = async function (req, res){
try {
    let bookID = req.params.bookId
    if(!isValidObjectId(bookID)) { return res.status(400).send({status : false , message : " please provide a valid id"})}
    if(Object.keys(bookID)==0) { return res.status(400).send({status : false, message : "Book id is required"})}
    let data = req.body
    if(Object.keys(data)==0){return res.status(400).send({status : false , message : "Data not provided"})}
    let book = await bookModel.findById(bookID)
    if(!book){ return res.status(400).send({status : false , message : "book is not available"})}
    const isDeleted = book.isDeleted
    if(isDeleted == true){ return res.status(400).send({ status : false , message : " Book is already deleted"})}
    const uniqueISBN = await bookModel.findOne({ISBN : data.ISBN})
    if (uniqueISBN) { return res.status(400).send({ status : false, msg : "ISBN is already available"})}
    const uniqueTitle = await bookModel.findOne({title : data.title})
    if (uniqueTitle) { return res.status(400).send({ status : false, msg : "Title is already available"})}
    const Updated = await bookModel.findOneAndUpdate({ _id:bookID},{... data},{ new : true})
    return res.status(200).send({ status : true , data: Updated})
    
}
   
    catch (error){
        return res.status(500).send({ status : false, message : error.message})
    }
}
//....................DeleteBookByPathParam......................................................
const deleteBooks= async function(req,res){
    try {
        let bookId= req.params.bookId
        if(!bookId){
            res.status(400).send({status:false,message:"plese enter bookId"})
        }
        if(!isValidObjectId(bookId)){ 
             res.status(400).send({status : false, message : " it's not a valid book Id"})
            }
            let bookData= await bookModel.findById(bookId)
            if(!bookData){
                res.status(404).send({status:false, message:"book not found"})
            }
            if (bookData.isDeleted === true) {
                 res.status(400).send({ status:false,message: "Book is already deleted" })
              }
            
            let deleteBook = await bookModel.findOneAndUpdate({ _id: bookId }, { $set: { isDeleted: true, deletedAt: new Date()}}, { new: true })
            res.status(200).send({ status: true, message: "Book is sucessfully deleted", })
          }   
    catch (err) {
        return res.status(500).send({ status: false, message: err.message, })
  }}

module.exports={createBook,getBooks,getBookByParams,updateBooks,deleteBooks}
 v
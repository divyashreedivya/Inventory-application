var Item = require('../models/item');
var Category = require('../models/category');
var async = require('async');
const {body, validationResult} = require('express-validator');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null, './public/uploads/');
    },
    filename: function(req, file, cb){
        cb(null, Date.now()+file.originalname)
    }
});
const fileFilter= (req, file, cb)=>{
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/svg') {
        cb(null, true);
      } else {
        cb(null, false);
      }
};
const upload = multer({
    storage : storage,
    limits:{
        filesize : 1024*1024*5
    },
    fileFilter : fileFilter
});

exports.index = (req, res, next)=>{
    async.parallel({
        item_count: function(callback){
            Item.countDocuments({}, callback);
        },
        category_count : function(callback){
            Category.countDocuments({}, callback);
        }
    },function(err, results){
        res.render('index',{title: 'Parisara Nursery Inventory', error: err,data: results});
    });
};

exports.item_list = function(req, res, next){
    Item.find({},'name')
    .populate('category')
    .exec(function(err, list_items){
        if(err) { return next(err);}
        console.log(list_items[0].image);
        res.render('item_list',{title:'Item List', item_list: list_items});
    })
}

exports.item_detail = function(req, res , next){
    Item.findById(req.params.id)
    .populate('category')
    .exec(function(err, item){
        if(err) {return next(err);}
        if(item==null){
            var err = new Error('Item not found');
            err.status = 404;
            return next(err);
        }
        console.log(item.image);
        res.render('item_detail',{title:item.name, item:item,});
    });         
};

exports.item_create_get = function(req, res, next){
    Category.find({})
    .exec(function(err, categories){
        if(err) { return next(err);}
        res.render('item_form',{title:'Create Item',category_list: categories});
    });
};

exports.item_create_post = [
    //Convert category to array
  /* (req, res, next) => {
        console.log('First function called');
        if(!(req.body.category instanceof Array)){
            if(typeof req.body.category ==='undefined')
            req.body.category = [];
            else
            req.body.category = new Array(req.body.category);
        }
        next();
    },*/
    //Validate and sanitise fields
    upload.single('image'),
    body('name','Item name required').trim().isLength({min:1}).escape(),
    body('description','Description required').trim().isLength({min:1}).escape(),
    body('sc_name').trim().escape(),
    body('price').trim().escape(),
    body('number_in_stock','Number in stock required').trim().isLength({min:1}).escape(),
    /*body('category.*').escape(),*/
    body('category','Category is required').trim().isLength({min:1}).escape(),

    (req, res, next)=>{
        // Extract the validation errors from a request.
        console.log('Sanitisation done');
        const errors = validationResult(req);
        console.log('validation called');
        // Create a item object with escaped and trimmed data.
        //var category = mongoose.Types.ObjectId(req.body.category);
        var item = new Item({
            name : req.body.name,
            description : req.body.description,
            sc_name : req.body.sc_name,
            price : req.body.price,
            number_in_stock : req.body.number_in_stock,
            category : req.body.category,
            //image: req.file? req.file.path : 'uploads/no_image.jpg',
            image: req.file? 'uploads/'+req.file.filename : 'uploads/no_image.jpg',
        });

        if(!errors.isEmpty()){
            //There are error . Render form again
            Category.find({})
            .exec(function(err, categories){
                if(err) { return next(err);}
                /*for(let i =0;i<categories.length;i++){
                    if(item.category.indexOf(categories[i]._id)>-1){
                        categories[i].checked = 'true';
                    }
                }*/
                res.render('item_form',{title:'Create Item',category_list: categories, item:item, errors: errors.array()});
            });
            return;
        }
        else{
            item.save(function(err){
                if(err) {return next(err);}
                res.redirect(item.url);
            });
        }
    }
];
    

exports.item_delete_get = function(req, res, next){
    Item.findById(req.params.id)
    .populate('category')
    .exec(function(err, item){
        if(err) {return next(err);}
        if(item==null){
            res.redirect('/inventory/items');
        }
        res.render('item_delete',{title:'Delete Item', item:item});
    });
};

exports.item_delete_post = function(req, res, next){
    Item.findById(req.body.id)
    .populate('category')
    .exec(function(err,item){
        if(err) {return next(err);}
        Item.findByIdAndRemove(req.body.id,function deleteItem(err){
            if(err) {return next(err);}
            res.redirect('/inventory/items');
        });
    });
};

exports.item_update_get = function(req, res, next){
    async.parallel({
        item : function(callback){
            Item.findById(req.params.id).populate('category').exec(callback);
        },
        categories : function(callback){
            Category.find(callback);
        },
    },function(err, results){
        if(err) {return next(err);}
        if(results.item==null){
            var err = new Error('Item not found');
            err.status = 404;
            return next(err);
        }
        /*for(i=0;i<results.categories.length;i++){
            for(j=0;j<results.item.category.length;j++){
                if(results.categories[i]._id.toString()==results.item.category[j]._id.toString()){
                    results.categories[i].checked = 'true';
                }
            }
        }*/
        res.render('item_form',{title:'Update Item',category_list:results.categories,item:results.item});
    });
};

exports.item_update_post = [
    //Convert category to array
    /*(req, res, next) => {
        console.log('First function called');
        if(!(req.body.category instanceof Array)){
            if(typeof req.body.category ==='undefined')
            req.body.category = [];
            else
            req.body.category = new Array(req.body.category);
        }
        next();
    },*/
    //Validate and sanitise fields
    upload.single('image'),
    body('name','Item name required').trim().isLength({min:1}).escape(),
    body('description','Description required').trim().isLength({min:1}).escape(),
    body('sc_name').trim().escape(),
    body('price').trim().escape(),
    body('number_in_stock','Number in stock required').trim().isLength({min:1}).escape(),
    /*body('category.*').escape(),*/
    body('category','Category is required').trim().isLength({min:1}).escape(),

    (req, res, next)=>{
        // Extract the validation errors from a request.
        console.log('Sanitisation done');
        const errors = validationResult(req);
        console.log('validation called');
        console.log(req.file);
        // Create a item object with escaped and trimmed data.
        //var category = mongoose.Types.ObjectId(req.body.category);
        var item = new Item({
            name : req.body.name,
            description : req.body.description,
            sc_name : req.body.sc_name,
            price : req.body.price,
            number_in_stock : req.body.number_in_stock,
            /*category : (typeof req.body.category==='undefined') ? []: req.body.category,*/
            category : req.body.category,
            //image: req.file? req.file.path : 'uploads/no_image.jpg',
            image: req.file? 'uploads/'+req.file.filename : 'uploads/no_image.jpg',
            _id : req.params.id
        });

        if(!errors.isEmpty()){
            //There are error . Render form again
            Category.find({},'name')
            .exec(function(err, categories){
                if(err) { return next(err);}
                /*for(let i =0;i<categories.length;i++){
                    if(item.category.indexOf(categories[i]._id)>-1){
                        categories[i].checked = 'true';
                    }
                }*/
                res.render('item_form',{title:'Update Item',category_list: categories, item:item, errors: errors.array()});
            });
            return;
        }
        else{
            Item.findByIdAndUpdate(req.params.id, item , {}, function(err,theitem){
                if(err) {return next(err);}
                res.redirect(theitem.url);
            });
        }
    }
];
    

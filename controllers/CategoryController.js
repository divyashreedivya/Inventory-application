var Category = require('../models/category');
var Item = require('../models/item');
var async = require('async');
const {body, validationResult} = require('express-validator');


exports.category_list = function(req, res, next){
    Category.find()
    .sort([['name','ascending']])
    .exec(function(err, list_categories){
        if(err) {return next(err);}
        res.render('category_list',{title:'Category List', category_list:list_categories});
    });
};

exports.category_detail = function(req, res , next){
    
    async.parallel({
        category: function(callback){
            Category.findById(req.params.id)
            .exec(callback)
        },

        category_items : function(callback){
            Item.find({'category':req.params.id})
            .exec(callback)
        }
    },function(err, results){
        if(err) { return next(err);}
        if(results.category==null){
            var err = new Error('Category not found');
            err.status = 404;
            return next(err);
        }
        res.render('category_detail', {title:'Category Detail',category: results.category, category_items: results.category_items});
    });
};

exports.category_create_get = function(req, res, next){
    res.render('category_form', {title: 'Create Category'});
}

exports.category_create_post = [
    body('name',' category name required').trim().isLength({min:1}).escape(),
    body('description').trim().escape(),

    (req, res, next)=>{
        const errors = validationResult(req);

        var category = new Category(
            {
                name:req.body.name,
                description : req.body.description
            }
        );
        if(!errors.isEmpty()){
            res.render('category_form',{title:'Create Category', category: category, errors: errors.array()});
            return;
        }
        else{
            Category.findOne({'name':req.body.name})
            .exec(function(err, found_category){
                if(err) {return next(err);}
                if(found_category){
                    res.redirect(found_category.url);
                }
                else{
                    category.save(function(err){
                        if(err) {return next(err);}
                        res.redirect(category.url);
                    })
                }
            })
        }
    }
]

exports.category_delete_get = function(req, res, next){
    async.parallel({
        category: function(callback){
            Category.findById(req.params.id).exec(callback)
        },
        category_items : function(callback){
            Item.find({'category':req.params.id}).exec(callback)
        },
    },function(err,results){
        if(err) {return next(err);}
        if(results.category==null){
            res.redirect('/inventory/categories');
        }
        res.render('category_delete',{title:'Delete Category',category:results.category,category_items:results.category_items});
    });
};

exports.category_delete_post = function(req, res, next){
    async.parallel({
        category: function(callback){
            Category.findById(req.params.id).exec(callback)
        },
        category_items : function(callback){
            Item.find({'category':req.params.id}).exec(callback)
        },
    },function(err,results){
        if(err) {return next(err);}
        if(results.category_items.length>0){
            //Category has items
            res.render('category_delete',{title:'Delete Category',category:results.category,category_items:results.category_items});
            return;
        }
        else{
            Category.findByIdAndRemove(req.body.id, function deleteCategory(err){
                if(err) {return next(err);}
                res.redirect('/inventory/categories');
            })
        }
    });
}

exports.category_update_get = function(req, res, next){
    Category.findById(req.params.id, function(err, category){
        if(err) {return next(err);}
        if(category==null){
            var err = new Error('Category not found');
            err.status = 404;
            return next(err);
        }
        res.render('category_form',{title:'Update Category',category:category});
    })
}

exports.category_update_post = [
    body('name',' category name required').trim().isLength({min:1}).escape(),
    body('description','Description required').trim().isLength({min:1}).escape(),

    (req, res, next)=>{
        const errors = validationResult(req);
        var category = new Category({
            name : req.body.name,
            description : req.body.description,
            _id : req.params.id,
        });
        if(!errors.isEmpty()){
            res.render('category_form',{title:'Update Category',category:category,errors: errors.array()});
            return;
        }
        else{
            Category.findByIdAndUpdate(req.params.id, category, {}, function(err, thecategory){
                if(err) {return next(err);}
                res.redirect(thecategory.url);
            })
        }
    }
];
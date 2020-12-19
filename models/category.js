var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var CategorySchema = new Schema(
    {
        name: {type:String, required:true, min_length:3, max_length:100},
        description: {type:String , required:true},
    }
);

//Virtual for category's url
CategorySchema
.virtual('url')
.get(function(){
    return '/inventory/category/'+ this._id;
})

module.exports = mongoose.model('Category', CategorySchema);
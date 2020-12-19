var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ItemSchema = new Schema(
    {
        name : {type:String, required:true,min_length:3, max_length:100},
        description: {type:String, required:true},
        sc_name: {type:String, min_length:3},
        price : {type: Number, required:true},
        number_in_stock : {type:Number, required:true},
        category: {type: Schema.Types.ObjectId, ref:'Category', required:true},
        image : {type:String, default:'/public/uploads/no_image.jpg'}
    }
);

//Virtual for item's url
ItemSchema
.virtual('url')
.get(function(){
    return '/inventory/item/'+this._id;
})

module.exports = mongoose.model('Item', ItemSchema);

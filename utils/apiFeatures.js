import mongoose from "mongoose";

class ApiFeatures {
    constructor(query, queryStr) {
        this.query = query;
        this.queryStr = queryStr;
    }

    search() {
        if (this.queryStr.keyword) {
            const regex = new RegExp(this.queryStr.keyword, "i");
            this.query = this.query.find({ name: regex });
        }
        return this;
    }

    categoryFilter() {
    if (this.queryStr.category) {
        const categories = this.queryStr.category.split(",").filter(id => mongoose.Types.ObjectId.isValid(id));
        if (categories.length > 0) {
            this.query = this.query.find({
                category: { $in: categories.map(id => new mongoose.Types.ObjectId(id)) },
            });
        }
    }
    return this;
}
    colorFilter() {
        if (this.queryStr.color) {
            let colors = [];
            if (typeof this.queryStr.color === "string" && this.queryStr.color.includes(",")) {
                colors = this.queryStr.color.split(",").map(s => s.trim());
            } else {
                colors = [this.queryStr.color];
            }
            if (colors.length > 0) {
                this.query = this.query.find({
                    "colors.colorName": { $in: colors }
                });
            }
        }
        return this;
    }


    priceFilter() {
        if (this.queryStr.price) {
            const priceRange = JSON.parse(this.queryStr.price);
            this.query = this.query.find({
                price: { $gte: priceRange.min, $lte: priceRange.max }
            });
        }
        return this;
    }

    filter() {
        let queryCopy = { ...this.queryStr };
        const removeFields = ["keyword", "page", "limit", "sort", "category", "color", "price"];
        removeFields.forEach((key) => delete queryCopy[key]);

        let queryStr = JSON.stringify(queryCopy);
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, match => `$${match}`);

        this.query = this.query.find(JSON.parse(queryStr));
        return this;
    }

    sort() {
        if (this.queryStr.sort) {
            const sortBy = this.queryStr.sort.split(",").join(" ");
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort("-createdAt");
        }
        return this;
    }
}

export default ApiFeatures;

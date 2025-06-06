import { Category, SubCategory } from "../Models/CategoryModel.js";
import catchAsyncErrors from "../middlewares/catchAsyncError.js";
import Order from "../Models/OrderModel.js";
import Product from "../Models/ProductModel.js";
import User from "../Models/UserModel.js";

const calculatePercentage = (thisMonth, lastMonth) => {
    if (lastMonth === 0) return thisMonth * 100;  // Handle divide by zero
    return Number((((thisMonth - lastMonth) / lastMonth) * 100).toFixed(0));
};

// **GET CATEGORIES FUNCTION**
const getCategories = async (categories, productsCount) => {
    const categoriesCountPromise = categories.map((category) =>
        Product.countDocuments({ category: category._id })
    );
    const categoriesCount = await Promise.all(categoriesCountPromise);

    return categories.map((category, i) => ({
        [category.name]: Math.round((categoriesCount[i] / productsCount) * 100),
    }));
};

// **GET CHART DATA FUNCTION**
const getChartData = ({ length, docArr, today, property }) => {
    const data = new Array(length).fill(0);

    docArr.forEach((i) => {
        const creationDate = i.createdAt;
        const monthDiff = (today.getFullYear() - creationDate.getFullYear()) * 12 + today.getMonth() - creationDate.getMonth();

        if (monthDiff < length) {
            if (property) {
                data[length - monthDiff - 1] += i[property] || 0;
            } else {
                data[length - monthDiff - 1] += 1;
            }
        }
    });

    return data;
};

// **GET DASHBOARD STATS**
export const getDashboardStats = catchAsyncErrors(async (req, res) => {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const thisMonth = {
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: today,
    };
    const lastMonth = {
        start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
        end: new Date(today.getFullYear(), today.getMonth(), 0),
    };

    const [
        thisMonthProducts,
        lastMonthProducts,
        thisMonthUsers,
        lastMonthUsers,
        thisMonthOrders,
        lastMonthOrders,
        lastSixMonthOrders,
        productsCount,
        usersCount,
        allOrders,
        categories,
        latestTransactions,
    ] = await Promise.all([
        Product.find({ createdAt: { $gte: thisMonth.start, $lte: thisMonth.end } }),
        Product.find({ createdAt: { $gte: lastMonth.start, $lte: lastMonth.end } }),
        User.find({ createdAt: { $gte: thisMonth.start, $lte: thisMonth.end } }),
        User.find({ createdAt: { $gte: lastMonth.start, $lte: lastMonth.end } }),
        Order.find({ createdAt: { $gte: thisMonth.start, $lte: thisMonth.end } }),
        Order.find({ createdAt: { $gte: lastMonth.start, $lte: lastMonth.end } }),
        Order.find({ createdAt: { $gte: sixMonthsAgo, $lte: today } }),
        Product.countDocuments(),
        User.countDocuments(),
        Order.find({}).select("total"),
        Category.find({}), // Fetch all categories
        Order.find({}).select(["orderItems", "discountAmount", "total", "status"]).limit(4),
    ]);

    // Ensure arrays are properly initialized
    const thisMonthRevenue =
        Array.isArray(thisMonthOrders) && thisMonthOrders.length
            ? thisMonthOrders.reduce((total, order) => total + (order.total || 0), 0)
            : 0;

    const lastMonthRevenue =
        Array.isArray(lastMonthOrders) && lastMonthOrders.length
            ? lastMonthOrders.reduce((total, order) => total + (order.total || 0), 0)
            : 0;

    const changePercent = {
        revenue: calculatePercentage(thisMonthRevenue, lastMonthRevenue),
        product: calculatePercentage(
            Array.isArray(thisMonthProducts) ? thisMonthProducts.length : 0,
            Array.isArray(lastMonthProducts) ? lastMonthProducts.length : 0
        ),
        user: calculatePercentage(
            Array.isArray(thisMonthUsers) ? thisMonthUsers.length : 0,
            Array.isArray(lastMonthUsers) ? lastMonthUsers.length : 0
        ),
        order: calculatePercentage(
            Array.isArray(thisMonthOrders) ? thisMonthOrders.length : 0,
            Array.isArray(lastMonthOrders) ? lastMonthOrders.length : 0
        ),
    };

    const revenue =
        Array.isArray(allOrders) && allOrders.length
            ? allOrders.reduce((total, order) => total + (order.total || 0), 0)
            : 0;

    const count = {
        revenue,
        product: productsCount || 0,
        user: usersCount || 0,
        order:
            Array.isArray(allOrders) && allOrders.length ? allOrders.length : 0,
    };

    const orderMonthCounts = getChartData({
        length: 6,
        today,
        docArr:
            Array.isArray(lastSixMonthOrders) && lastSixMonthOrders.length
                ? lastSixMonthOrders
                : [],
    });

    const orderMonthRevenue = getChartData({
        length: 6,
        today,
        docArr:
            Array.isArray(lastSixMonthOrders) && lastSixMonthOrders.length
                ? lastSixMonthOrders
                : [],
        property: "total",
    });

    const categoryCount = await getCategories(categories || [], productsCount || 1);



    const modifiedLatestTransaction =
        Array.isArray(latestTransactions) && latestTransactions.length
            ? latestTransactions.map((i) => ({
                _id: i._id,
                discount: i.discountAmount || 0,
                amount: i.total || 0,
                quantity:
                    Array.isArray(i.orderItems) && i.orderItems.length
                        ? i.orderItems.length
                        : 0,
                status: i.status || "N/A",
            }))
            : [];

    return res.status(200).json({
        success: true,
        stats: {
            categoryCount,
            changePercent,
            count,
            chart: { orders: orderMonthCounts, revenue: orderMonthRevenue },
            latestTransaction: modifiedLatestTransaction,
        },
    });
});

// **GET PIE CHART DATA**
export const getPieCharts = catchAsyncErrors(async (req, res) => {
    const [categories, productsCount, processing, shipped, delivered] =
        await Promise.all([
            Category.find({}), // Fetch all categories
            Product.countDocuments(),
            Order.countDocuments({ status: "Processing" }),
            Order.countDocuments({ status: "Shipped" }),
            Order.countDocuments({ status: "Delivered" }),
        ]);

    const categoryCount = {}; // Fix: Ensure categoryCount is structured correctly
    for (const category of categories) {
        const count = await Product.countDocuments({ category: category._id });
        categoryCount[category.name] = count; // Fix: Ensure category names are used as keys
    }
    const inStock = await Product.countDocuments({ stock: { $gt: 0 } });
    const outOfStock = await Product.countDocuments({ stock: 0 });

   

    return res.status(200).json({
        success: true,
        charts: {
            categoryCount,
            statusCount: { processing, shipped, delivered },
            stockCount: { inStock, outOfStock },
            // revenueDistribution,
        },
    });
});


// **GET BAR CHART DATA**
export const getBarCharts = catchAsyncErrors(async (req, res) => {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 5); // Ensures exactly 6 months back

    const lastSixMonthOrders = await Order.find({
        createdAt: { $gte: sixMonthsAgo, $lte: today },
    });

    // Function to generate last 6 months (including current month)
    const getLastSixMonths = () => {
        const months = [];
        const currentDate = new Date();

        for (let i = 5; i >= 0; i--) {
            let d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            months.push(d.toLocaleString("en-US", { month: "long" }));
        }

        return months;
    };

    const months = getLastSixMonths(); // Get correct month labels

    // Function to map orders/revenue to the correct months
    const getChartData = ({ docArr, property = "count" }) => {
        const monthData = new Array(6).fill(0); // Initialize data array with zeros

        docArr.forEach((order) => {
            const orderDate = new Date(order.createdAt);
            const orderMonth = orderDate.toLocaleString("en-US", { month: "long" });
            const index = months.indexOf(orderMonth); // Find correct index
            if (index !== -1) {
                monthData[index] += property === "total" ? order.total : 1; // Sum up revenue or orders
            }
        });

        return monthData;
    };

    return res.status(200).json({
        success: true,
        charts: {
            months, // Send correct month labels
            orders: getChartData({ docArr: lastSixMonthOrders }),
            revenue: getChartData({ docArr: lastSixMonthOrders, property: "total" }),
        },
    });
});



// **GET LINE CHART DATA**
export const getLineCharts = catchAsyncErrors(async (req, res) => {
    const today = new Date();
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);


    // Function to generate last 12 months dynamically
    const getLastTwelveMonths = () => {
        const months = [];
        for (let i = 11; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            months.push(date.toLocaleString("en-US", { month: "long" })); // e.g., ["April", "May", ..., "March"]
        }
        return months;
    };

    const months = getLastTwelveMonths();

    const [products, users, orders] = await Promise.all([
        Product.find({ createdAt: { $gte: twelveMonthsAgo, $lte: today } }).select("createdAt"),
        User.find({ createdAt: { $gte: twelveMonthsAgo, $lte: today } }).select("createdAt"),
        Order.find({ createdAt: { $gte: twelveMonthsAgo, $lte: today } }).select(["createdAt", "discount", "total"]),
    ]);

    return res.status(200).json({
        success: true,
        charts: {
            users: getChartData({ length: 12, today, docArr: users }),
            products: getChartData({ length: 12, today, docArr: products }),
            discount: getChartData({ length: 12, today, docArr: orders, property: "discount" }),
            revenue: getChartData({ length: 12, today, docArr: orders, property: "total" }),
            months, // Include dynamic month labels
        },
    });
});


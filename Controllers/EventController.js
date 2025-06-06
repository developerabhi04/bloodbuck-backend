import catchAsyncErrors from '../middlewares/catchAsyncError.js';
import cloudinary from 'cloudinary';
import { BannerEvent, ProductEvent } from '../Models/EventModel.js';

const uploadBuffer = (buffer, folder) =>
  new Promise((resolve, reject) => {
    cloudinary.v2.uploader.upload_stream({ folder }, (err, result) => {
      if (err) return reject(err);
      resolve({ public_id: result.public_id, url: result.secure_url });
    }).end(buffer);
  });

const deleteMany = async (ids = []) => {
  await Promise.all(ids.map(id => cloudinary.v2.uploader.destroy(id)));
};


// addBanner
export const addBanner = [
  // single file: banner
  (req, res, next) => next(), // replace with multer.single('banner')
  catchAsyncErrors(async (req, res) => {
    const { title, heading, description } = req.body;
    let bannerData;
    if (req.file) {
      bannerData = await uploadBuffer(req.file.buffer, 'events/banner');
    }
    const banner = await BannerEvent.create({ title, heading, description, banner: bannerData });
    res.status(201).json({ success: true, banner });
  }),
];

// getAllBanners
export const getAllBanners = catchAsyncErrors(async (req, res) => {
  const banners = await BannerEvent.find().sort({ createdAt: -1 });
  res.json({ success: true, banners });
});

// getSingleBanner
export const getSingleBanner = catchAsyncErrors(async (req, res) => {
  const banner = await BannerEvent.findById(req.params.id);
  if (!banner) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, banner });
});


// updateBanner
export const updateBanner = [
  (req, res, next) => next(), // replace with multer.single('banner')
  catchAsyncErrors(async (req, res) => {
    const { title, heading, description } = req.body;
    const banner = await BannerEvent.findById(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: 'Not found' });

    if (req.file && banner.banner?.public_id) {
      await deleteMany([banner.banner.public_id]);
      banner.banner = await uploadBuffer(req.file.buffer, 'events/banner');
    }

    if (title !== undefined) banner.title = title;
    if (heading !== undefined) banner.heading = heading;
    if (description !== undefined) banner.description = description;

    await banner.save();
    res.json({ success: true, banner });
  }),
];


// delete banner
export const deleteBanner = catchAsyncErrors(async (req, res) => {
  const banner = await BannerEvent.findById(req.params.id);
  if (!banner) return res.status(404).json({ success: false, message: 'Not found' });
  const ids = banner.banner?.public_id ? [banner.banner.public_id] : [];
  await deleteMany(ids);
  await banner.deleteOne();
  res.json({ success: true, message: 'Banner deleted' });
});











// addProduct
export const addProduct = [
  // multiple files: photos
  (req, res, next) => next(), // replace with multer.array('photos', 5)
  catchAsyncErrors(async (req, res) => {
    const { heading, description } = req.body;
    let photos = [];
    if (req.files) {
      photos = await Promise.all(req.files.map(f => uploadBuffer(f.buffer, 'events/photos')));
    }
    const product = await ProductEvent.create({ heading, description, photos });
    res.status(201).json({ success: true, product });
  }),
];



// getAllProducts
export const getAllProducts = catchAsyncErrors(async (req, res) => {
  const products = await ProductEvent.find().sort({ createdAt: -1 });
  res.json({ success: true, products });
});


// getSingleProduct
export const getSingleProduct = catchAsyncErrors(async (req, res) => {
  const product = await ProductEvent.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, product });
});



// updateProduct
export const updateProduct = [
  (req, res, next) => next(), // replace with multer.array('photos', 5)
  catchAsyncErrors(async (req, res) => {
    const { heading, description } = req.body;
    const product = await ProductEvent.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Not found' });

    if (req.files) {
      const oldIds = product.photos.map(p => p.public_id);
      await deleteMany(oldIds);
      product.photos = await Promise.all(req.files.map(f => uploadBuffer(f.buffer, 'events/photos')));
    }

    if (heading !== undefined) product.heading = heading;
    if (description !== undefined) product.description = description;

    await product.save();
    res.json({ success: true, product });
  }),
];


// Delete product and all its photos
export const deleteProduct = catchAsyncErrors(async (req, res) => {
  const product = await ProductEvent.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Not found' });
  const ids = product.photos.map(p => p.public_id);
  await deleteMany(ids);
  await product.deleteOne();
  res.json({ success: true, message: 'Product deleted' });
});
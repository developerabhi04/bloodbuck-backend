import mongoose from 'mongoose';


const bannerEventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    heading: { type: String, required: true },
    description: { type: String, required: true },
    banner: {
      public_id: String,
      url: String,
    },
  },
  { timestamps: true }
);

const productEventSchema = new mongoose.Schema(
  {
    heading: { type: String, required: true },
    description: { type: String, required: true },
    photos: [
      {
        public_id: String,
        url: String,
      },
    ],
  },
  { timestamps: true }
);

export const BannerEvent = mongoose.model('Bannerevents', bannerEventSchema);
export const ProductEvent = mongoose.model('Productevents', productEventSchema);
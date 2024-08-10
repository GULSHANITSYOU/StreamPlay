import mongoose, { Schema } from "mongoose";

const subscriptionSchem = new Schema({
  subscriber: {
    typeof: Schema.Types.ObjectId,
    ref: "User",
  },
  channel: {
    typeof: Schema.Types.ObjectId,
    ref: "User",
  },
},{timestamps:true});

export const subscription = mongoose.model("subscription", subscriptionSchem);

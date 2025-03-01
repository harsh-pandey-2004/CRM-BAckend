const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  collegeName: { type: String, required: true },
  collegeLocation: { type: String, required: true },
  collegeLogo: { type: String },
  aboutUsSub: { type: String },
  highestPackage: { type: String },
  averagePackage: { type: String },
  established: { type: Number },
  collegeImage: { type: String },

  overview: [{ type: String }],

  coursesAndFeeHeading: { type: String },
  coursesAndFee: [{
    course: { type: String },
    duration: { type: String },
    fee: { type: Number },
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true }
  }],

  minFee: { type: Number },
  maxFee: { type: mongoose.Schema.Types.Mixed },

  admissionProcess: {
    description: { type: String },
    steps: [{ type: String }]
  },

  approvalAndRanking: {
    description: { type: String }
  },

  certificates: [{ type: String }],

  placement: {
    description: { type: String },
    companies: [{ type: String }],
    stats: {
      placementRate: { type: String },
      highestPackage: { type: String }
    },
    topCompanies: [{ type: String }]
  },

  faculty: [{ type: String }],

  examDetails: {
    difficulty: { type: String },
    averageCGPA: { type: String },
    minimumCGPA: { type: String },
    other: { type: String }
  },

  gallery: [{ type: String }],

  sampleDegree: {
    description: { type: String },
    image: { type: String }
  },

  reviews: [{
    name: { type: String },
    review: [{
      type: { type: String },
      content: { type: String },
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true }
    }]
  }],

  examPattern: {
    title: { type: String },
    steps: [{ type: String }]
  }
});

const College = mongoose.model('College', collegeSchema);

module.exports = College;
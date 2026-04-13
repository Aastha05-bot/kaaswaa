const axios = require('axios');

async function testSubmit() {
  try {
    const res = await axios.post('http://localhost:5000/api/feedback', {
      product_id: 1,
      ratings: 5,
      comment: "Test review"
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.error("Status:", err.response?.status);
    console.error("Data:", JSON.stringify(err.response?.data, null, 2));
  }
}

testSubmit();

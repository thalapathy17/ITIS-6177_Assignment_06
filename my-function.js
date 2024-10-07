export const handler = async (event) => {
  const keyword = event.queryStringParameters.keyword;
  return {
      statusCode: 200,
      body: JSON.stringify({ "message": `Abhishek says ${keyword}` }),
  };
};

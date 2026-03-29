function UnAuthorized() {
  return (
    <div style={{
      width: "100%",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      fontFamily: "sans-serif",
      background: "#fff8f9"
    }}>
      <h1 style={{ color: "#e85a8a", fontSize: "48px", margin: 0 }}>403</h1>
      <p style={{ color: "#3b3b3b", fontSize: "18px" }}>You are not authorized to view this page.</p>
      <a href="/" style={{ color: "#e85a8a", marginTop: "16px" }}>Go back to Login</a>
    </div>
  );
}

export default UnAuthorized;
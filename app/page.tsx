export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f7fa",
        fontFamily: "Arial, sans-serif",
        padding: "20px"
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "900px",
          background: "#ffffff",
          borderRadius: "16px",
          padding: "40px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
        }}
      >
        <h1
          style={{
            fontSize: "32px",
            marginBottom: "10px"
          }}
        >
          Chennai Goods Management
        </h1>

        <p
          style={{
            color: "#666",
            marginBottom: "30px"
          }}
        >
          Delivery Tracking System
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px"
          }}
        >
          <DashboardCard
            title="Total Delivery"
            value="0"
          />

          <DashboardCard
            title="Total In Stock"
            value="0"
          />

          <DashboardCard
            title="Total Out of Stock"
            value="0"
          />

          <DashboardCard
            title="Completed Delivery"
            value="0"
          />

          <DashboardCard
            title="Stocks To Check"
            value="0"
          />

          <DashboardCard
            title="Payment To Collect"
            value="0"
          />
        </div>
      </section>
    </main>
  );
}

function DashboardCard({
  title,
  value
}: {
  title: string;
  value: string;
}) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "20px",
        background: "#fafafa"
      }}
    >
      <div
        style={{
          fontSize: "15px",
          color: "#666",
          marginBottom: "10px"
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "30px",
          fontWeight: "bold"
        }}
      >
        {value}
      </div>
    </div>
  );
}

import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const menus = [
    {
      title: "Input Sell Out",
      desc: "Input transaksi penjualan SPG",
      icon: "📝",
      path: "/input",
      color: "#c00000"
    },
    {
      title: "Permit",
      desc: "Konfirmasi Tidak Ada Sell Out",
      icon: "✅",
      path: "/permit",
      color: "#16a34a"
    },
    {
      title: "Summary 1 Bulan",
      desc: "Cek Isi Sell Out SPG",
      icon: "📊",
      path: "/summary",
      color: "#2563eb"
    },

    {
    title: "Summary All SPG",
    desc: "View All SPG",
    icon: "📈",
    path: "/summary-all",
    color: "#7c3aed"
     }
  ];

  const openMenu = (path) => {
    sessionStorage.setItem("fromHome", "true");
    navigate(path);
  };

  return (
    <div className="home-container">

      {/* HEADER */}
      <div className="header">

        <div className="logo">
          SPG
        </div>

        <h1>Sales Management</h1>

        <p>Dashboard aktivitas & monitoring SPG</p>

      </div>

      {/* MENU */}
      <div className="menu-grid">

        {menus.map((item, index) => (
          <div
            className="menu-card"
            key={index}
            onClick={() => openMenu(item.path)}
          >

            <div
              className="icon-box"
              style={{ background: item.color }}
            >
              {item.icon}
            </div>

            <div className="menu-content">
              <h2>{item.title}</h2>
              <p>{item.desc}</p>
            </div>

            <div className="arrow">→</div>

          </div>
        ))}

      </div>

      {/* FOOTER */}
      <div className="footer">
        © 2026 SPG Management System
      </div>

      {/* STYLE */}
      <style>{`

*{
  box-sizing:border-box;
}

.home-container{
  min-height:100vh;
  background: linear-gradient(135deg,#eef2ff,#f8fafc);
  padding:40px 20px;
  font-family: "Segoe UI", Arial, sans-serif;
}

/* HEADER */
.header{
  text-align:center;
  margin-bottom:40px;
}

.logo{
  width:80px;
  height:80px;
  margin:auto;
  display:flex;
  align-items:center;
  justify-content:center;
  border-radius:24px;
  background: linear-gradient(135deg,#c00000,#ff4d4d);
  color:white;
  font-size:32px;
  font-weight:800;
  box-shadow:0 20px 40px rgba(192,0,0,.3);
}

.header h1{
  margin-top:20px;
  margin-bottom:6px;
  font-size:32px;
  font-weight:800;
  color:#111827;
}

.header p{
  color:#6b7280;
  font-size:15px;
}

/* MENU */
.menu-grid{
  max-width:520px;
  margin:auto;
  display:flex;
  flex-direction:column;
  gap:18px;
}

/* CARD */
.menu-card{
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(10px);
  border-radius:22px;
  padding:20px;
  display:flex;
  align-items:center;
  gap:18px;
  cursor:pointer;
  box-shadow:0 10px 30px rgba(0,0,0,.08);
  transition:all .25s ease;
  position:relative;
  overflow:hidden;
}

/* HOVER EFFECT */
.menu-card:hover{
  transform: translateY(-6px) scale(1.01);
  box-shadow:0 25px 45px rgba(0,0,0,.15);
}

/* GLOW EFFECT */
.menu-card::before{
  content:"";
  position:absolute;
  inset:0;
  background:linear-gradient(120deg,transparent,rgba(255,255,255,.5),transparent);
  opacity:0;
  transition:.4s;
}

.menu-card:hover::before{
  opacity:1;
}

/* ICON */
.icon-box{
  width:65px;
  height:65px;
  border-radius:18px;
  display:flex;
  align-items:center;
  justify-content:center;
  color:white;
  font-size:30px;
  flex-shrink:0;
  box-shadow:0 10px 20px rgba(0,0,0,.2);
}

/* CONTENT */
.menu-content{
  flex:1;
}

.menu-content h2{
  margin:0;
  font-size:18px;
  color:#111827;
}

.menu-content p{
  margin-top:6px;
  margin-bottom:0;
  font-size:14px;
  color:#6b7280;
}

/* ARROW */
.arrow{
  font-size:26px;
  color:#9ca3af;
  transition:.25s;
}

.menu-card:hover .arrow{
  transform:translateX(6px);
  color:#111827;
}

/* FOOTER */
.footer{
  text-align:center;
  margin-top:45px;
  color:#9ca3af;
  font-size:13px;
}

/* MOBILE */
@media(max-width:600px){

  .header h1{
    font-size:26px;
  }

  .menu-card{
    padding:16px;
  }

  .icon-box{
    width:55px;
    height:55px;
    font-size:26px;
  }

}

      `}</style>

    </div>
  );
}
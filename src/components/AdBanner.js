import { useEffect } from "react";

export default function AdsterraAd() {
  useEffect(() => {
    const script1 = document.createElement("script");
    script1.innerHTML = `
      atOptions = {
        'key' : 'd35f08df6c236dd37dcb2ec1061491a0',
        'format' : 'iframe',
        'height' : 250,
        'width' : 300,
        'params' : {}
      };
    `;

    const script2 = document.createElement("script");
    script2.src = "//www.highperformanceformat.com/d35f08df6c236dd37dcb2ec1061491a0/invoke.js";
    script2.type = "text/javascript";

    const container = document.getElementById("adsterra-container");
    if (container) {
      container.innerHTML = ""; // clear previous if rerendering
      container.appendChild(script1);
      container.appendChild(script2);
    }
  }, []);

  return (
    <div className="w-full flex justify-center items-center py-4">
      <div
        id="adsterra-container"
        style={{ width: "300px", height: "250px" }}
      ></div>
    </div>
  );
}

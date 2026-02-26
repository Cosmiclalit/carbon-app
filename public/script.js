async function calculate() {
  const electricity = document.getElementById("electricity").value;
  const acHours = document.getElementById("acHours").value;
  const transport = document.getElementById("transport").value;
  const shopping = document.getElementById("shopping").value;
  const socket = io();

socket.on("notification", (message) => {
  const li = document.createElement("li");
  li.innerText = message;
  document.getElementById("notifications").appendChild(li);
});

  const response = await fetch("/calculate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      electricity,
      acHours,
      transport,
      shopping
    })
  });

  const data = await response.json();

  document.getElementById("co2").innerText =
    "Total CO2: " + data.totalCO2 + " kg";

  document.getElementById("advice").innerText =
    data.aiAdvice;

  const meteri = document.getElementById("meterFill");


  let percentage = Math.min((data.totalCO2 / 300) * 100, 100);

  meteri.style.width = percentage + "%";
  function getCarbonCategory(score) {
    let category = "";
   if (score <= 150) {
      category = "Green";
    } else if (score <= 350) {
      category = "Yellow";
    } else {
      category = "Red";
    }

    return category;
}
     function changeTheColor(score){
      if (score <= 150) {
        meteri.style.background = "green";
        document.getElementById("rating").innerText = "🌿 Low Impact";
    } else if (score <= 350) {
      meteri.style.background = "yellow";
       document.getElementById("rating").innerText = "⚡ Moderate Impact";
    } else {
      meteri.style.background = "red";
       document.getElementById("rating").innerText = "⚠️ High Impact";
    }
     }
  changeTheColor(data.totalCO2);
}
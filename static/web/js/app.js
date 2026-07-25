document.addEventListener("DOMContentLoaded", () => {
  const sidebarToggle = document.getElementById("sidebarToggle");
  if (sidebarToggle) {
    sidebarToggle.addEventListener("click", () => {
      document.body.classList.toggle("sb-sidenav-toggled");
    });
  }

  document.querySelectorAll("form[data-confirm]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      if (!window.confirm(form.dataset.confirm)) {
        event.preventDefault();
      }
    });
  });

  document.querySelectorAll("[data-tabs]").forEach((tabs) => {
    tabs.querySelectorAll("[data-tab-button]").forEach((button) => {
      button.addEventListener("click", () => {
        const tab = button.dataset.tabButton;
        document.querySelectorAll("[data-tab-button]").forEach((item) => {
          item.classList.toggle("active", item.dataset.tabButton === tab);
        });
        document.querySelectorAll("[data-tab-panel]").forEach((panel) => {
          panel.hidden = panel.dataset.tabPanel !== tab;
        });
      });
    });
  });

  const methodSelect = document.querySelector("[data-payment-method]");
  const identifierRow = document.querySelector("[data-payment-identifier-row]");
  if (methodSelect && identifierRow) {
    const identifierInput = identifierRow.querySelector("input");
    const syncPaymentIdentifier = () => {
      const needsIdentifier = methodSelect.value !== "CASH";
      identifierRow.hidden = !needsIdentifier;
      if (identifierInput) {
        identifierInput.required = needsIdentifier;
        if (!needsIdentifier) {
          identifierInput.value = "";
        }
      }
    };
    methodSelect.addEventListener("change", syncPaymentIdentifier);
    syncPaymentIdentifier();
  }

  const typeSelect = document.querySelector("[data-zone-filter-source]");
  const zoneSelect = document.querySelector("[data-zone-filter-target]");
  if (typeSelect && zoneSelect) {
    const options = Array.from(zoneSelect.querySelectorAll("option[data-type]"));
    const syncZones = () => {
      const selectedType = typeSelect.value;
      options.forEach((option) => {
        option.hidden = Boolean(selectedType) && option.dataset.type !== selectedType;
      });
      const selectedOption = zoneSelect.selectedOptions[0];
      if (selectedOption && selectedOption.hidden) {
        zoneSelect.value = "";
      }
    };
    typeSelect.addEventListener("change", syncZones);
    syncZones();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const toggleNavigation = () => {
    document.body.classList.toggle("nav-open");
  };

  const closeNavigation = () => {
    document.body.classList.remove("nav-open");
  };

  document.querySelectorAll("#sidebarToggle, #mobileSidebarToggle").forEach((button) => {
    button.addEventListener("click", toggleNavigation);
  });

  const navScrim = document.querySelector("[data-nav-scrim]");
  if (navScrim) {
    navScrim.addEventListener("click", closeNavigation);
  }

  document.querySelectorAll("[data-account-menu]").forEach((menu) => {
    const trigger = menu.querySelector("[data-account-trigger]");
    const popoverKey = menu.dataset.accountMenu;
    const popover = popoverKey
      ? document.querySelector(`[data-account-popover="${popoverKey}"]`)
      : menu.querySelector("[data-account-popover]");

    if (!trigger || !popover) {
      return;
    }

    const setHidden = (element, isHidden) => {
      if (!element) {
        return;
      }
      element.hidden = isHidden;
      element.toggleAttribute("hidden", isHidden);
      element.classList.toggle("hidden", isHidden);
    };

    const positionPopover = () => {
      const triggerRect = trigger.getBoundingClientRect();
      const popoverRect = popover.getBoundingClientRect();
      const margin = 12;
      const gap = 10;
      const preferredLeft = triggerRect.right + gap;
      const fallbackLeft = triggerRect.left;
      const hasRightSpace = preferredLeft + popoverRect.width <= window.innerWidth - margin;
      const left = hasRightSpace ? preferredLeft : Math.min(fallbackLeft, window.innerWidth - popoverRect.width - margin);
      const preferredTop = triggerRect.top + (triggerRect.height / 2) - (popoverRect.height / 2);
      const top = Math.min(
        Math.max(margin, preferredTop),
        window.innerHeight - popoverRect.height - margin,
      );

      popover.style.left = `${Math.max(margin, left)}px`;
      popover.style.top = `${top}px`;
    };

    const closeMenu = () => {
      setHidden(popover, true);
      trigger.setAttribute("aria-expanded", "false");
    };

    const openMenu = () => {
      document.querySelectorAll("[data-account-menu]").forEach((otherMenu) => {
        if (otherMenu !== menu) {
          const otherPopoverKey = otherMenu.dataset.accountMenu;
          const otherPopover = otherPopoverKey
            ? document.querySelector(`[data-account-popover="${otherPopoverKey}"]`)
            : otherMenu.querySelector("[data-account-popover]");
          const otherTrigger = otherMenu.querySelector("[data-account-trigger]");
          setHidden(otherPopover, true);
          if (otherTrigger) {
            otherTrigger.setAttribute("aria-expanded", "false");
          }
        }
      });
      setHidden(popover, false);
      trigger.setAttribute("aria-expanded", "true");
      window.requestAnimationFrame(positionPopover);
    };

    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (popover.hidden) {
        openMenu();
      } else {
        closeMenu();
      }
    });

    popover.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    document.addEventListener("click", (event) => {
      if (!menu.contains(event.target) && !popover.contains(event.target)) {
        closeMenu();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu();
        closeNavigation();
      }
    });
    window.addEventListener("resize", () => {
      if (!popover.hidden) {
        positionPopover();
      }
    });
  });

  document.querySelectorAll("form[data-confirm]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      if (!window.confirm(form.dataset.confirm)) {
        event.preventDefault();
      }
    });
  });

  const closeMessage = (message) => {
    if (!message) {
      return;
    }
    message.classList.add("is-leaving");
    window.setTimeout(() => message.remove(), 180);
  };

  document.querySelectorAll("[data-app-message]").forEach((message) => {
    message.querySelectorAll("[data-app-message-close]").forEach((button) => {
      button.addEventListener("click", () => closeMessage(message));
    });

    if (!message.classList.contains("app-message-error")) {
      window.setTimeout(() => closeMessage(message), 6500);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      document.querySelectorAll("[data-app-message]").forEach(closeMessage);
    }
  });

  const syncSelectState = (select) => {
    select.classList.toggle("is-empty", !select.value);
  };

  document.querySelectorAll("select").forEach((select) => {
    syncSelectState(select);
    select.addEventListener("change", () => syncSelectState(select));
  });

  document.querySelectorAll("[data-photo-picker]").forEach((picker) => {
    const input = picker.querySelector("[data-photo-input]");
    const preview = picker.querySelector("[data-photo-preview]");
    const count = picker.querySelector("[data-photo-count]");
    const error = picker.querySelector("[data-photo-error]");
    const button = picker.querySelector("[data-photo-button]");
    const maxPhotos = Number.parseInt(picker.dataset.photoMax || "4", 10);
    let files = [];
    let previewUrls = [];

    if (!input || !preview) {
      return;
    }

    const setError = (message = "") => {
      if (!error) {
        return;
      }
      error.textContent = message;
      error.classList.toggle("hidden", !message);
      error.hidden = !message;
    };

    const syncCount = () => {
      if (count) {
        count.textContent = `${files.length} / ${maxPhotos} photo${files.length > 1 ? "s" : ""}`;
      }
      picker.classList.toggle("is-full", files.length >= maxPhotos);
    };

    const renderPreview = () => {
      previewUrls.forEach((url) => window.URL.revokeObjectURL(url));
      previewUrls = [];
      preview.innerHTML = "";

      files.forEach((file, index) => {
        const item = document.createElement("div");
        item.className = "photo-preview-item";

        const image = document.createElement("img");
        const url = window.URL.createObjectURL(file);
        previewUrls.push(url);
        image.src = url;
        image.alt = file.name || `Photo ${index + 1}`;

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "photo-preview-remove";
        removeButton.setAttribute("aria-label", "Retirer cette photo");
        removeButton.textContent = "x";
        removeButton.addEventListener("click", () => {
          files.splice(index, 1);
          syncInputFiles();
          setError("");
        });

        item.append(image, removeButton);
        preview.appendChild(item);
      });

      syncCount();
    };

    const syncInputFiles = () => {
      if ("DataTransfer" in window) {
        const transfer = new DataTransfer();
        files.forEach((file) => transfer.items.add(file));
        input.files = transfer.files;
      }
      renderPreview();
    };

    if (button) {
      button.addEventListener("click", (event) => {
        if (files.length >= maxPhotos) {
          event.preventDefault();
          setError(`Maximum ${maxPhotos} photos pour un vehicule.`);
        }
      });
    }

    input.addEventListener("change", () => {
      const incomingFiles = Array.from(input.files || []);
      if (!incomingFiles.length) {
        syncInputFiles();
        return;
      }

      const remainingSlots = maxPhotos - files.length;
      if (remainingSlots <= 0) {
        setError(`Maximum ${maxPhotos} photos pour un vehicule.`);
        syncInputFiles();
        return;
      }

      files = files.concat(incomingFiles.slice(0, remainingSlots));
      if (incomingFiles.length > remainingSlots) {
        setError(`Seulement ${remainingSlots} photo${remainingSlots > 1 ? "s" : ""} ajoutee${remainingSlots > 1 ? "s" : ""}. Maximum ${maxPhotos}.`);
      } else {
        setError("");
      }
      syncInputFiles();
    });

    renderPreview();
  });

  document.querySelectorAll("[data-entry-form]").forEach((form) => {
    const plateInput = form.querySelector("[data-entry-plate]");
    const dataNode = document.getElementById("known-vehicles-data");
    if (!plateInput || !dataNode) {
      return;
    }

    const knownCard = form.querySelector("[data-entry-known]");
    const knownPlate = form.querySelector("[data-entry-known-plate]");
    const knownMeta = form.querySelector("[data-entry-known-meta]");
    const knownPhoto = form.querySelector("[data-entry-known-photo]");
    const knownIcon = form.querySelector("[data-entry-known-icon]");
    const emptyState = form.querySelector("[data-entry-empty]");
    const emptyTitle = form.querySelector("[data-entry-empty-title]");
    const emptyText = form.querySelector("[data-entry-empty-text]");
    const newFields = form.querySelector("[data-new-vehicle-fields]");
    const newInputs = form.querySelectorAll("[data-new-vehicle-input]");
    const submitButton = form.querySelector("[data-entry-submit]");
    const vehicleTypeSelect = form.querySelector("select[name='vehicle_type']");
    const depositorNameInput = form.querySelector("[data-entry-depositor-name]");
    const depositorPhoneInput = form.querySelector("[data-entry-depositor-phone]");
    let lastAutoDepositorName = "";
    let lastAutoDepositorPhone = "";

    let vehicles = [];
    try {
      vehicles = JSON.parse(dataNode.textContent || "[]");
    } catch (error) {
      vehicles = [];
    }

    const normalizePlate = (value) => (value || "").trim().toUpperCase();
    const vehiclesByPlate = new Map(
      vehicles.map((vehicle) => [normalizePlate(vehicle.plaque), vehicle]),
    );

    const setHidden = (element, isHidden) => {
      if (!element) {
        return;
      }
      element.hidden = isHidden;
      element.toggleAttribute("hidden", isHidden);
      element.classList.toggle("hidden", isHidden);
    };

    const setNewVehicleFields = (isVisible) => {
      setHidden(newFields, !isVisible);
      newInputs.forEach((input) => {
        input.disabled = !isVisible;
      });
      if (vehicleTypeSelect) {
        vehicleTypeSelect.required = isVisible;
        syncSelectState(vehicleTypeSelect);
      }
    };

    const fillFieldFromLatest = (input, value, lastAutoValue) => {
      if (!input || !value) {
        return lastAutoValue;
      }
      if (!input.value || input.value === lastAutoValue) {
        input.value = value;
        return value;
      }
      return lastAutoValue;
    };

    const clearAutoDepositor = () => {
      if (depositorNameInput && depositorNameInput.value === lastAutoDepositorName) {
        depositorNameInput.value = "";
      }
      if (depositorPhoneInput && depositorPhoneInput.value === lastAutoDepositorPhone) {
        depositorPhoneInput.value = "";
      }
      lastAutoDepositorName = "";
      lastAutoDepositorPhone = "";
    };

    const fillDepositor = (vehicle) => {
      lastAutoDepositorName = fillFieldFromLatest(
        depositorNameInput,
        vehicle.depositor_name,
        lastAutoDepositorName,
      );
      lastAutoDepositorPhone = fillFieldFromLatest(
        depositorPhoneInput,
        vehicle.depositor_phone,
        lastAutoDepositorPhone,
      );
    };

    const setIdleState = () => {
      setHidden(knownCard, true);
      setHidden(emptyState, true);
      if (emptyState) {
        emptyState.classList.remove("search-state-empty");
        emptyState.classList.add("search-state-idle");
      }
      if (emptyTitle) {
        emptyTitle.textContent = "Saisis la plaque";
      }
      if (emptyText) {
        emptyText.textContent = "PARKY affiche automatiquement le vehicule si la plaque est deja connue.";
      }
      setNewVehicleFields(false);
      clearAutoDepositor();
      if (submitButton) {
        submitButton.textContent = "Confirmer l'entree";
      }
    };

    const setUnknownState = () => {
      setHidden(knownCard, true);
      setHidden(emptyState, false);
      if (emptyState) {
        emptyState.classList.remove("search-state-idle");
        emptyState.classList.add("search-state-empty");
      }
      if (emptyTitle) {
        emptyTitle.textContent = "Plaque non reconnue";
      }
      if (emptyText) {
        emptyText.textContent = "Complete le type, la marque et la couleur pour enregistrer ce vehicule.";
      }
      setNewVehicleFields(true);
      clearAutoDepositor();
      if (submitButton) {
        submitButton.textContent = "Enregistrer et garer";
      }
    };

    const setKnownState = (vehicle) => {
      setHidden(emptyState, true);
      setHidden(knownCard, false);
      if (knownPlate) {
        knownPlate.textContent = vehicle.plaque || plateInput.value;
      }
      if (knownMeta) {
        const details = [vehicle.type, vehicle.marque, vehicle.couleur].filter(Boolean);
        knownMeta.textContent = details.length ? details.join(" - ") : "Vehicule deja enregistre";
      }
      if (knownPhoto && knownIcon) {
        if (vehicle.photo) {
          knownPhoto.src = vehicle.photo;
          setHidden(knownPhoto, false);
          setHidden(knownIcon, true);
        } else {
          knownPhoto.removeAttribute("src");
          setHidden(knownPhoto, true);
          setHidden(knownIcon, false);
        }
      }
      setNewVehicleFields(false);
      fillDepositor(vehicle);
      if (submitButton) {
        submitButton.textContent = "Confirmer l'entree";
      }
    };

    const syncEntryVehicle = () => {
      const plate = normalizePlate(plateInput.value);
      if (!plate) {
        setIdleState();
        return;
      }

      const vehicle = vehiclesByPlate.get(plate);
      if (vehicle) {
        setKnownState(vehicle);
        return;
      }

      setUnknownState();
    };

    plateInput.addEventListener("input", syncEntryVehicle);
    plateInput.addEventListener("change", () => {
      plateInput.value = normalizePlate(plateInput.value);
      syncEntryVehicle();
    });
    syncEntryVehicle();
  });

  document.querySelectorAll("[data-payment-method]").forEach((methodSelect) => {
    const form = methodSelect.closest("form") || document;
    const identifierRow = form.querySelector("[data-payment-identifier-row]");
    if (!identifierRow) {
      return;
    }

    const identifierInput = identifierRow.querySelector("input");
    const syncPaymentIdentifier = () => {
      const needsIdentifier = methodSelect.value !== "CASH";
      identifierRow.hidden = !needsIdentifier;
      identifierRow.classList.toggle("hidden", !needsIdentifier);
      if (identifierInput) {
        identifierInput.required = needsIdentifier;
        identifierInput.disabled = !needsIdentifier;
        if (!needsIdentifier) {
          identifierInput.value = "";
        }
      }
    };
    methodSelect.addEventListener("change", syncPaymentIdentifier);
    syncPaymentIdentifier();
  });

});

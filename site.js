const motion = matchMedia("(prefers-reduced-motion: reduce)");
const intro = document.querySelector("#intro");
const hero = document.querySelector(".hero");
const revealHero = () => {
  if (!location.hash) hero.classList.add("hero-arrived");
};
intro.showModal();
let introTimer = setTimeout(() => {
  revealHero();
  intro.classList.add("is-leaving");
  introTimer = setTimeout(() => intro.close(), motion.matches ? 440 : 840);
}, motion.matches ? 1700 : 2200);
intro.querySelector(".intro-skip").addEventListener("click", () => intro.close());
intro.addEventListener("close", () => {
  clearTimeout(introTimer);
  revealHero();
});

const music = document.querySelector("#ambient-music");
const musicButton = document.querySelector(".music-button");
const musicLabel = musicButton.querySelector(".music-label");
const musicStatus = document.querySelector("#music-status");
music.volume = .55;
musicButton.hidden = false;
const updateMusicButton = () => {
  const playing = !music.paused;
  musicButton.setAttribute("aria-pressed", String(playing));
  musicLabel.textContent = playing ? "音楽を止める" : "音楽を聴く";
};
const musicGestures = ["click", "keydown"];
const playMusic = async (requested = false) => {
  try {
    await music.play();
  } catch (error) {
    if (error.name === "AbortError" || (error.name === "NotAllowedError" && !requested)) return;
    musicStatus.textContent = "音楽を再生できませんでした。";
    musicLabel.textContent = "音楽を再試行";
  }
};
const resumeMusicOnInteraction = (event) => {
  if (!event.isTrusted || event.key === "Escape" || musicButton.contains(event.target)) return;
  if (music.paused) void playMusic();
};
musicGestures.forEach((event) => document.addEventListener(event, resumeMusicOnInteraction, true));
music.addEventListener("playing", () => {
  musicGestures.forEach((event) => document.removeEventListener(event, resumeMusicOnInteraction, true));
  updateMusicButton();
});
music.addEventListener("pause", updateMusicButton);
musicButton.addEventListener("click", () => {
  musicStatus.textContent = "";
  if (!music.paused) {
    music.pause();
    updateMusicButton();
    return;
  }
  void playMusic(true);
});
void playMusic();

if ("IntersectionObserver" in window) {
  const reveal = new IntersectionObserver((entries) => {
    entries.filter((entry) => entry.isIntersecting).forEach((entry, index) => {
      const frames = motion.matches ? [{ opacity: .5 }, { opacity: 1 }] : [
        { opacity: .18, transform: "translateY(28px)" },
        { opacity: 1, transform: "translateY(0)" }
      ];
      entry.target.animate(frames, {
        duration: motion.matches ? 320 : 680,
        delay: motion.matches ? 0 : Math.min(index * 80, 240),
        fill: "backwards",
        easing: "cubic-bezier(.2,.8,.3,1)"
      });
      reveal.unobserve(entry.target);
    });
  }, { threshold: .2 });
  document.querySelectorAll("[data-reveal]").forEach((element) => reveal.observe(element));
}

const gallery = document.querySelector("[data-gallery]");
const galleryChoices = Array.from(gallery.querySelectorAll(".gallery-choice"));
const galleryOpen = gallery.querySelector("[data-gallery-open]");
const galleryImage = document.querySelector("#gallery-image");
const galleryName = document.querySelector("#gallery-name");
const galleryDialog = document.querySelector("#gallery-dialog");
const galleryDialogImage = document.querySelector("#gallery-dialog-image");
const galleryDialogVisual = galleryDialogImage.parentElement;
const galleryDialogTitle = document.querySelector("#gallery-dialog-title");
let currentPhoto = 0;
let photoFade;

function showPhoto(index) {
  currentPhoto = (index + galleryChoices.length) % galleryChoices.length;
  const choice = galleryChoices[currentPhoto];
  const title = choice.querySelector("span").textContent;
  const needsCentering = Boolean(choice.querySelector(".centered-photo"));
  const count = (currentPhoto + 1) + " / " + galleryChoices.length;
  galleryChoices.forEach((item) => {
    if (item === choice) item.setAttribute("aria-current", "true");
    else item.removeAttribute("aria-current");
  });
  galleryOpen.classList.toggle("centered-photo", needsCentering);
  galleryOpen.href = choice.href;
  galleryOpen.setAttribute("aria-label", title + "の画像を拡大");
  galleryImage.src = choice.href;
  galleryImage.alt = title;
  galleryName.textContent = title;
  if (galleryDialog.open) {
    galleryDialogVisual.classList.toggle("centered-photo", needsCentering);
    galleryDialogTitle.textContent = title;
    galleryDialogImage.src = choice.href;
    galleryDialogImage.alt = title;
  }
  document.querySelectorAll("[data-gallery-count]").forEach((element) => { element.textContent = count; });
}

function stepPhoto(index) {
  showPhoto(index);
  photoFade?.cancel();
  const image = galleryDialog.open ? galleryDialogImage : galleryImage;
  photoFade = image.animate([{ opacity: .38 }, { opacity: 1 }], { duration: motion.matches ? 210 : 360, easing: "ease-out" });
}

galleryChoices.forEach((choice, index) => {
  choice.addEventListener("click", (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    stepPhoto(index);
  });
});
galleryOpen.addEventListener("click", (event) => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  galleryDialog.showModal();
  showPhoto(currentPhoto);
});
document.querySelectorAll("[data-gallery-step]").forEach((button) => {
  button.addEventListener("click", () => stepPhoto(currentPhoto + Number(button.dataset.galleryStep)));
});
galleryDialog.addEventListener("keydown", (event) => {
  if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
  event.preventDefault();
  stepPhoto(currentPhoto + (event.key === "ArrowRight" ? 1 : -1));
});
showPhoto(0);
gallery.querySelector(".gallery-controls").hidden = false;

document.querySelectorAll("[data-tabset]").forEach((tabList) => {
  const tabs = Array.from(tabList.querySelectorAll("a"));
  const panels = tabs.map((tab) => document.getElementById(tab.hash.slice(1)));
  const select = (selected, focus = false) => {
    tabs.forEach((tab, index) => {
      const active = index === selected;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      panels[index].hidden = !active;
    });
    if (focus) tabs[selected].focus();
  };

  tabList.setAttribute("role", "tablist");
  tabs.forEach((tab, index) => {
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", panels[index].id);
    panels[index].setAttribute("role", "tabpanel");
    panels[index].setAttribute("aria-labelledby", tab.id);
    tab.addEventListener("click", (event) => {
      event.preventDefault();
      select(index);
    });
    tab.addEventListener("keydown", (event) => {
      const next = {
        ArrowLeft: (index + tabs.length - 1) % tabs.length,
        ArrowRight: (index + 1) % tabs.length,
        Home: 0,
        End: tabs.length - 1
      }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      select(next, true);
    });
  });

  const selectFromHash = () => {
    const match = tabs.findIndex((tab) => tab.hash === location.hash);
    if (match >= 0) select(match);
    return match >= 0;
  };
  if (!selectFromHash()) select(0);
  window.addEventListener("hashchange", () => {
    if (selectFromHash()) tabList.scrollIntoView({ block: "start" });
  });
});

const reservation = document.querySelector("#reservation");
const context = document.querySelector("#reservation-context");
const reservationList = reservation.querySelector(".reservation-list");
document.querySelectorAll(".shop").forEach((shop) => {
  const source = shop.querySelector(".shop-call");
  const call = document.createElement("a");
  const name = document.createElement("span");
  const number = document.createElement("strong");
  call.href = source.getAttribute("href");
  name.textContent = shop.querySelector("h3").textContent;
  number.textContent = source.lastChild.textContent.trim();
  call.append(name, number);
  reservationList.append(call);
});

const poster = document.querySelector("#poster");
const posterImage = poster.querySelector("img");
const posterTitle = poster.querySelector("h2");
document.querySelectorAll("[data-reserve], [data-poster]").forEach((link) => {
  link.addEventListener("click", (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (link.hasAttribute("data-reserve")) {
      context.textContent = link.dataset.reserve;
      context.hidden = !link.dataset.reserve;
      reservation.showModal();
    } else {
      const title = link.closest(".course-panel").querySelector("h3").textContent;
      posterTitle.textContent = title;
      posterImage.alt = title + "のポスター";
      posterImage.src = link.href;
      poster.showModal();
    }
  });
});
for (const dialog of [reservation, poster, galleryDialog]) {
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
}

const mobileNav = document.querySelector(".mobile-nav");
mobileNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => { mobileNav.open = false; });
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && mobileNav.open) {
    mobileNav.open = false;
    mobileNav.querySelector("summary").focus();
  }
});

(function () {
  "use strict";

  const courses = {
    PSYC101: { code: "PSYC 101", name: "Introduction to Psychology", looking: 8 },
    BUSI241: { code: "BUSI 241", name: "Marketing Principles", looking: 12 },
    CSCI162: { code: "CSCI 162", name: "Introduction to Computer Science", looking: 6 },
    ENGL100: { code: "ENGL 100", name: "Reading and Writing About Literature", looking: 5 },
    MATH105: { code: "MATH 105", name: "Precalculus Mathematics", looking: 9 }
  };

  const currentPage = document.body.dataset.page;
  const currentFile = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".site-nav a").forEach(function (link) {
    if (link.getAttribute("href") === currentFile) link.setAttribute("aria-current", "page");
  });

  if (currentPage === "course") {
    const requestedCourse = new URLSearchParams(window.location.search).get("course") || "PSYC101";
    const course = courses[requestedCourse] || courses.PSYC101;
    document.title = course.code + " — StudyMatch";
    document.getElementById("course-title").textContent = course.name;
    document.getElementById("course-subtitle").textContent =
      course.code + " · St. Francis Xavier University";
    document.querySelector(".board-count strong").textContent = course.looking;

    document.querySelectorAll(".join-button").forEach(function (button) {
      button.addEventListener("click", function () {
        button.textContent = "Request sent!";
        button.disabled = true;
        button.setAttribute("aria-label", "Request to join sent");
      });
    });
  }

  if (currentPage === "network") {
    const estimates = {
      5: { posts: 2, matches: 1, message: "With only 5 students the board is quiet. A couple of classmates can get a session started, but there are not many options yet." },
      15: { posts: 6, matches: 4, message: "At 15 students, a few study plans are starting to appear. More classmates means more chances to find someone with a similar schedule." },
      40: { posts: 16, matches: 12, message: "At 40 students, you suddenly have real options. It's easier to find a time, a study style, and a group that fits." },
      80: { posts: 32, matches: 24, message: "With 80 students, the board has lots of activity. There are more groups, more schedules, and more ways to find a good match." }
    };

    const count = document.getElementById("student-count");
    const posts = document.getElementById("open-posts");
    const matches = document.getElementById("potential-matches");
    const message = document.getElementById("network-message");

    function updateNetwork(size) {
      const estimate = estimates[size];
      count.textContent = size;
      posts.textContent = estimate.posts;
      matches.textContent = estimate.matches;
      message.textContent = estimate.message;
      document.getElementById("posts-bar").style.width = (estimate.posts / 32 * 100) + "%";
      document.getElementById("matches-bar").style.width = (estimate.matches / 24 * 100) + "%";
      document.querySelectorAll(".student-option").forEach(function (button) {
        const selected = Number(button.dataset.students) === size;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-pressed", selected ? "true" : "false");
      });
    }

    document.querySelectorAll(".student-option").forEach(function (button) {
      button.addEventListener("click", function () {
        updateNetwork(Number(button.dataset.students));
      });
    });
  }
})();

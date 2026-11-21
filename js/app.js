import { loadData } from "./data-loader.js";
import {
    calculateStudentResult,
    calculateScholarships
} from "./grade-calculator.js";
import { renderStudentList } from "./student-list.js";
import { setupStudentModal } from "./student-modal.js";
import { renderStatistics } from "./statistics.js";
import { setupCompareSection } from "./compare.js";

const state = {
    students: [],
    subjects: [],
    grades: [],
    initialGrades: [],
    sortByName: false,
    editingStudentId: null
};

function buildEnrichedMap(students, subjects, grades) {
    const gradeMap = new Map(grades.map(grade => [grade.student_id, grade]));
    const map = new Map();
    const gradedEntries = [];

    for (const student of students) {
        const grade = gradeMap.get(student.id);
        if (!grade || !grade.scores) {
            map.set(student.id, {
                student,
                hasGrade: false,
                result: null
            });
            continue;
        }

        const result = calculateStudentResult(grade, subjects);
        const entry = {
            id: student.id,
            name: student.name,
            average: result.average,
            student,
            hasGrade: true,
            result
        };
        map.set(student.id, entry);
        gradedEntries.push(entry);
    }

    const ranked = calculateScholarships(gradedEntries);
    for (const item of ranked) {
        item.result.rank = item.rank;
        item.result.scholarshipGroup = item.scholarshipGroup;
        item.result.scholarship = item.scholarship;
    }

    return map;
}

function showAlert(message) {
    const alertBanner = document.getElementById("alertBanner");
    if (!alertBanner) return;
    alertBanner.textContent = message;
    alertBanner.hidden = false;

    clearTimeout(alertBanner._hideTimer);
    alertBanner._hideTimer = setTimeout(() => {
        alertBanner.hidden = true;
    }, 4500);
}

async function init() {
    const loadingMessage = document.getElementById("loadingMessage");
    const errorMessage = document.getElementById("errorMessage");
    const searchInput = document.getElementById("searchInput");
    const sortNameButton = document.getElementById("sortNameButton");
    const sortNameIndicator = document.getElementById("sortNameIndicator");
    const resetDataButton = document.getElementById("resetDataButton");
    const navTabs = Array.from(document.querySelectorAll(".nav-tab"));
    const viewPanels = Array.from(document.querySelectorAll("[data-view-panel]"));

    let currentEnrichedMap = new Map();

    try {
        const { students, subjects, grades } = await loadData();
        state.students = students;
        state.subjects = subjects;
        state.grades = grades;
        state.initialGrades = JSON.parse(JSON.stringify(grades));

        function getFilteredStudents() {
            const keyword = searchInput.value.trim().toLowerCase();
            if (!keyword) return state.students;
            return state.students.filter(
                student =>
                    student.id.toLowerCase().includes(keyword) ||
                    student.name.toLowerCase().includes(keyword)
            );
        }

        let compareController = null;

        function refreshAll() {
            currentEnrichedMap = buildEnrichedMap(state.students, state.subjects, state.grades);
            renderStudentList(getFilteredStudents(), state.subjects, currentEnrichedMap, {
                sortByName: state.sortByName
            });
            renderStatistics(state.students, state.subjects, currentEnrichedMap);
            if (compareController) {
                compareController.refresh();
            }
        }

        currentEnrichedMap = buildEnrichedMap(state.students, state.subjects, state.grades);
        renderStudentList(state.students, state.subjects, currentEnrichedMap, {
            sortByName: state.sortByName
        });
        renderStatistics(state.students, state.subjects, currentEnrichedMap);
        compareController = setupCompareSection(
            state.students,
            state.subjects,
            () => currentEnrichedMap
        );

        setupStudentModal(
            state,
            () => currentEnrichedMap,
            refreshAll,
            showAlert
        );

        searchInput.addEventListener("input", () => {
            renderStudentList(getFilteredStudents(), state.subjects, currentEnrichedMap, {
                sortByName: state.sortByName
            });
        });

        sortNameButton.addEventListener("click", () => {
            state.sortByName = !state.sortByName;
            sortNameButton.classList.toggle("is-active", state.sortByName);
            sortNameIndicator.textContent = state.sortByName ? "Tên A → Z" : "Mặc định";
            renderStudentList(getFilteredStudents(), state.subjects, currentEnrichedMap, {
                sortByName: state.sortByName
            });
        });

        resetDataButton.addEventListener("click", () => {
            state.grades.length = 0;
            const restored = JSON.parse(JSON.stringify(state.initialGrades));
            state.grades.push(...restored);
            searchInput.value = "";
            state.sortByName = false;
            sortNameButton.classList.remove("is-active");
            sortNameIndicator.textContent = "Mặc định";
            refreshAll();
            showAlert("Đã khôi phục toàn bộ bảng điểm về dữ liệu gốc ban đầu.");
        });

        navTabs.forEach(tab => {
            tab.addEventListener("click", () => {
                const targetView = tab.dataset.view;
                navTabs.forEach(t => t.classList.toggle("active", t === tab));
                viewPanels.forEach(panel => {
                    panel.hidden = panel.dataset.viewPanel !== targetView;
                });
            });
        });

        loadingMessage.hidden = true;
    } catch (error) {
        loadingMessage.hidden = true;
        errorMessage.hidden = false;
        errorMessage.textContent = error.message;
        console.error(error);
    }
}

init();

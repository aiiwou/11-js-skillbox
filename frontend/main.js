const now = new Date();
const table = document.querySelector('.table');
const container = document.querySelector('.container');
let filteredList = []
let studentsList = []

function formatDate(date) {

    var dd = date.getDate();
    if (dd < 10) dd = '0' + dd;

    var mm = date.getMonth() + 1;
    if (mm < 10) mm = '0' + mm;

    var yy = date.getFullYear();
    if (yy < 10) yy = '0' + yy;

    return dd + '.' + mm + '.' + yy;
}

function getStudentItem(studentObj) {
    const fullName = document.createElement('td');
    const faculty = document.createElement('td');
    const birthDate = document.createElement('td');
    const yearsOfEduc = document.createElement('td');
    
    const {secondName, name, surName} = studentObj;
    fullName.textContent = [secondName, name, surName].join(' ').trim();

    let age = now.getFullYear() - studentObj.birthDate.getFullYear();
    age = (now.getMonth() < studentObj.birthDate.getMonth() || (now.getMonth() === studentObj.birthDate.getMonth() && now.getDate() < studentObj.birthDate.getDate())) ? age - 1 : age;
    birthDate.textContent = formatDate(studentObj.birthDate) + ` (${age} лет)`;
    faculty.textContent = studentObj.faculty;
    const yearOfEduc = studentObj.eduDate;
    const gradYear = parseInt(yearOfEduc) + 4;
    const course = (gradYear === now.getFullYear() && now.getMonth() >= 8) || now.getFullYear() > gradYear ? 'закончил' : `${(now.getFullYear() - yearOfEduc + 1)} курс`;
    yearsOfEduc.textContent = `${studentObj.eduDate}-${gradYear} (${course})`;

    

    return {
        fullName, faculty, birthDate, yearsOfEduc
    }
}

function renderStudentsTable(studentsArray) {

    let id = 0;
    const allRows = document.querySelectorAll('.stud-row');
    for (const row of allRows) { table.removeChild(row) };
    for (const stud of studentsArray) {
        const btn = createDeleteButton();
        btn.dataset.id = id;
        id++;
        const studItem = getStudentItem(stud);
        const row = document.createElement('tr');
        row.classList.add('stud-row')
        row.appendChild(studItem.fullName);
        row.appendChild(studItem.faculty);
        row.appendChild(studItem.birthDate);
        row.appendChild(studItem.yearsOfEduc);
        row.appendChild(btn)
        table.appendChild(row);
    }
}



const form = document.querySelector('.form');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const inputs = document.querySelectorAll('input');
    const fullNameInput = document.querySelector('.full-name').value;
    const birthInput = document.querySelector('.birth').valueAsDate;
    const eduYearInput = document.querySelector('.education-year').value;
    const facInput = document.querySelector('.fac').value;
    if (isValidInput({fullName: fullNameInput, birth: birthInput, educationYear: eduYearInput, fac: facInput})) {

        const studObj = makeStudObj(fullNameInput, birthInput, eduYearInput, facInput)
        studentsList.push(studObj);
        
        await fetch('http://localhost:3000/students', {
            method: 'POST',
            body: JSON.stringify({
                name: studObj.name,
                secondName: studObj.secondName,
                surName: studObj.surName,
                birthDate: studObj.birthDate,
                eduDate: studObj.eduDate,
                faculty: studObj.faculty
            }),
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
        }});

        renderStudentsTable(studentsList);
        for (const inp of inputs) { inp.value = '' }
    }
})

function isValidInput(obj) {
    let errorContainer = document.createElement('div');
    errorContainer.classList.add('error-div');
    const errorText = document.createElement('p');
    errorText.classList.add('error-text');

    const dict = {
        fullName: {errorMessage: '', valid: null},
        birth: {errorMessage: 'Неверная дата рождения', valid: (value) => value >= new Date(1900, 0, 1) && value <= now},
        educationYear: {errorMessage: 'Неверный год начала обучения', valid: (value) => value >= 2000 && value <= now.getFullYear()},
        fac: {errorMessage: '', valid: null}
    }

    const errors =[];
    if (Object.values(obj).some(el => !el)) {
        errors.push('Все поля должны быть заполнены')
    }

    for (const [key, value] of Object.entries(obj)) {
        if (!dict[key].valid) continue;
        if (!dict[key].valid(value)) {
            errors.push(dict[key].errorMessage)
        }
    }

    if (errors.length) {
        if (document.querySelector('.error-div')) {
            container.removeChild(document.querySelector('.error-div'))
        }
        errorText.textContent = errors.join(' ');
        errorContainer.appendChild(errorText);
        form.after(errorContainer)
        return false;
    }

    if (document.querySelector('.error-div')) {
        container.removeChild(document.querySelector('.error-div'));
    }

    return true;
}

function makeStudObj(fullNameInput, birthInput, eduYearInput, facInput) {
    fullNameInput = fullNameInput.split(' ');
    const secondName = fullNameInput[0];
    const name = fullNameInput[1];
    const surName = fullNameInput[2];
    return {
        name: name,
        secondName: secondName,
        surName: surName,
        birthDate: birthInput,
        eduDate: eduYearInput,
        faculty: facInput
    }
}

function sortStudents(argument) {
    if (table.classList.contains('filtered')) {
        filteredList.sort((a, b) => studentCompare(argument, a, b));
    }
    else {
        studentsList.sort((a, b) => studentCompare(argument, a, b));
    }
}

function studentCompare(argument, a, b) {
    const dict = {
        "0": [a.secondName, a.name, a.surName].join(' ').localeCompare([b.secondName, b.name, b.surName].join(' ')),
        "1": a.faculty.localeCompare(b.faculty),
        "2": a.birthDate - b.birthDate,
        "3": a.eduDate - b.eduDate
    }
    return dict[argument] || 0;
}

for (const header of document.querySelectorAll('th')) {
    header.addEventListener('click', () => {
        sortStudents(header.className);
        renderStudentsTable(table.classList.contains('filtered') ? filteredList : studentsList);
    })
}

const formFilter = document.querySelector('.form-filter');
formFilter.addEventListener('submit', (e) => {
    e.preventDefault();
    const fullNameInputFilter = document.querySelector('.full-name-filter').value;
    const eduYearStartInputFilter = document.querySelector('.education-start-year-filter').value;
    const eduYearEndInputFilter = document.querySelector('.education-end-year-filter').value;
    const facInputFilter = document.querySelector('.fac-filter').value;

    const obj = {fullName: fullNameInputFilter, eduYearStart: eduYearStartInputFilter, eduYearEnd: eduYearEndInputFilter, fac: facInputFilter};
    filteredList = [...studentsList];

    const dict = {
        fullName: (el) => [el.secondName, el.name, el.surName].join(' ').trim().toLowerCase().includes(fullNameInputFilter.toLowerCase()),
        eduYearStart: (el) => parseInt(el.eduDate) === parseInt(eduYearStartInputFilter),
        eduYearEnd: el =>  parseInt(el.eduDate) + 4 === parseInt(eduYearEndInputFilter),
        fac: el => el.faculty.toLowerCase().includes(facInputFilter.toLowerCase())
    }

    for (const [key, value] of Object.entries(obj)) {
        if (value) {
            filteredList = filteredList.filter(dict[key])
        }
    }

    renderStudentsTable(filteredList);
    table.classList.add('filtered');
    if (Object.values(obj).every(el => !el)) {
        table.classList.remove('filtered')
    }
})

function createDeleteButton() {
    const btn = document.createElement('button');
    btn.className = 'btn error';
    btn.innerHTML = 'Удалить';

    btn.addEventListener('click', async e => {
        if(confirm('Вы уверены?')) {
            const index = btn.dataset.id;
            const deletedId = studentsList[index].id
            studentsList = studentsList.filter(el => el.id != deletedId);

            fetch(`http://localhost:3000/students/${deletedId}`, {
                method: "DELETE",
            })
            renderStudentsTable(studentsList);
        }
    })
    return btn;
}

document.addEventListener('DOMContentLoaded', async el => {
    const response = await fetch('http://localhost:3000/students');
    const studentsLogList = await response.json();
    studentsLogList.forEach(el => {
        el.birthDate = new Date(el.birthDate)
        studentsList.push(el);
    })
    renderStudentsTable(studentsList)
})
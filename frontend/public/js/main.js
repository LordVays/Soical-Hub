document.addEventListener('DOMContentLoaded', () => {

    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {

            e.preventDefault();

            const formData = new FormData(loginForm);
            const data = Object.fromEntries(formData.entries());

            try {

                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    window.location.href = '/home'; 
                } else {
                    displayMessage(result.message || result || "Ошибка входа.", 'error', loginForm);
                }

            } catch (err) {
                displayMessage("Ошибка сети при входе.", 'error', loginForm);
            }

        });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {

            e.preventDefault();

            const formData = new FormData(registerForm);
            const data = Object.fromEntries(formData.entries());

            try {

                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    displayMessage("Регистрация успешна! Теперь вы можете войти.", 'success', registerForm);
                    setTimeout(() => window.location.href = '/login', 2000);
                } else {
                    displayMessage(result.message || result.username || result.email || result.password || result || "Ошибка регистрации.", 'error', registerForm);
                }

            } catch (err) {
                displayMessage("Ошибка сети при регистрации.", 'error', registerForm);
            }

        });
    }

    const createPostForm = document.getElementById('createPostForm');

    if (createPostForm) {
        createPostForm.addEventListener('submit', async (e) => {

            e.preventDefault();

            const formData = new FormData(createPostForm);
            const currentUserId = document.body.dataset.currentUserId; 

            if (currentUserId) {
                formData.append('userId', currentUserId);
            } else {
                displayMessage("Ошибка: ID пользователя не найден. Пожалуйста, войдите снова.", 'error', createPostForm);
                return;
            }


            try {

                const response = await fetch('/api/posts', {
                    method: 'POST',
                    body: formData 
                });

                const result = await response.json();

                if (response.ok) {
                    displayMessage("Пост успешно создан!", 'success', createPostForm);
                    setTimeout(() => window.location.href = '/home', 1500);

                    createPostForm.reset();
                } else {
                    displayMessage(result.message || result || "Ошибка создания поста.", 'error', createPostForm);
                }

            } catch (err) {
                console.error("Create post error:", err);
                displayMessage("Ошибка сети при создании поста.", 'error', createPostForm);
            }

        });
    }

    document.body.addEventListener('click', async (e) => {
        if (e.target.matches('.like-btn')) {

            const postId = e.target.dataset.postId;
            const currentUserId = document.body.dataset.currentUserId;

            if (!currentUserId) {
                 alert("Пожалуйста, войдите, чтобы поставить лайк."); return;
            }

            try {

                const response = await fetch(`/api/posts/${postId}/like`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: currentUserId })
                });
                const result = await response.json();

                if (response.ok) {

                    const likeCountSpan = e.target.querySelector('.like-count');
                    const postCard = e.target.closest('.post-card');
                    const updatedPostRes = await fetch(`/api/posts/${postId}`);
                    const updatedPost = await updatedPostRes.json();

                    if (likeCountSpan) {
                        likeCountSpan.textContent = updatedPost.likes.length;
                    }

                    if (updatedPost.likes.includes(currentUserId)) {
                        e.target.classList.add('liked');
                        e.target.innerHTML = `❤️ <span class="like-count">${updatedPost.likes.length}</span>`;
                    } else {
                        e.target.classList.remove('liked');
                        e.target.innerHTML = `🤍 <span class="like-count">${updatedPost.likes.length}</span>`;
                    }

                } else {
                    alert(result.message || "Ошибка при лайке поста.");
                }

            } catch (err) {
                alert("Сетевая ошибка при лайке поста.");
            }

        }

        if (e.target.matches('.follow-btn')) {

            const profileUserId = e.target.dataset.profileUserId;
            const currentUserId = document.body.dataset.currentUserId;

             if (!currentUserId) {
                 alert("Пожалуйста, войдите, чтобы подписаться."); return;
            }

            if (currentUserId === profileUserId) {
                alert("Вы не можете подписаться на себя."); return;
            }

            const action = e.target.dataset.action; 

            try {

                const response = await fetch(`/api/users/${profileUserId}/${action}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: currentUserId })
                });

                const result = await response.json();

                if (response.ok) {
                    if (action === 'follow') {
                        e.target.textContent = 'Отписаться';
                        e.target.dataset.action = 'unfollow';
                        e.target.classList.remove('btn-primary');
                        e.target.classList.add('btn-secondary');
                    } else {
                        e.target.textContent = 'Подписаться';
                        e.target.dataset.action = 'follow';
                        e.target.classList.remove('btn-secondary');
                        e.target.classList.add('btn-primary');
                    }
                } else {
                    alert(result.message || "Ошибка операции.");
                }

            } catch (err) {
                alert("Сетевая ошибка.");
            }

        }

        if (e.target.matches('.delete-post-btn')) {

            if (!confirm("Вы уверены, что хотите удалить этот пост?")) return;

            const postId = e.target.dataset.postId;
            const currentUserId = document.body.dataset.currentUserId;

             if (!currentUserId) {
                 alert("Пожалуйста, войдите, чтобы удалить пост."); return;
            }

            try {

                const response = await fetch(`/api/posts/${postId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: currentUserId }) 
                });
                const result = await response.json();

                if (response.ok) {
                    e.target.closest('.post-card').remove();
                    alert("Пост удален.");
                } else {
                    alert(result.message || "Не удалось удалить пост.");
                }

            } catch (err) {
                alert("Сетевая ошибка при удалении поста.");
            }

        }

        if (e.target.matches('.submit-comment-btn')) {

            e.preventDefault(); 

            const form = e.target.closest('.comment-form');
            const postId = form.dataset.postId;
            const text = form.querySelector('textarea[name="text"]').value;
            const currentUserId = document.body.dataset.currentUserId;

            if (!text.trim()) { alert("Комментарий не может быть пустым."); return; }
             if (!currentUserId) {
                 alert("Пожалуйста, войдите, чтобы комментировать."); return;
            }

            try {

                const response = await fetch(`/api/posts/${postId}/comment`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: currentUserId, text: text })
                });

                const result = await response.json();

                if (response.ok) {
                    alert("Комментарий добавлен! Обновите страницу, чтобы увидеть."); 
                    form.reset();
                } else {
                    alert(result.message || "Не удалось добавить комментарий.");
                }

            } catch (err) {
                alert("Сетевая ошибка при добавлении комментария.");
            }

        }

    }); 


    function displayMessage(message, type = 'info', formElement) {

        const existingAlert = formElement.parentNode.querySelector('.dynamic-alert');

        if (existingAlert) existingAlert.remove();

        const alertDiv = document.createElement('div');

        alertDiv.className = `alert alert-${type} dynamic-alert`;
        alertDiv.textContent = message;

        formElement.parentNode.insertBefore(alertDiv, formElement); 

        setTimeout(() => {
            if(alertDiv) alertDiv.remove();
        }, 5000);

    }

});
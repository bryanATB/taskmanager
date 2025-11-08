package demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import demo.model.User;

public interface UserRepository extends JpaRepository<User, Long> {
    User findByEmail(String email);
}
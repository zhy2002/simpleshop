package simpleshop.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import simpleshop.data.EmployeeDAO;
import simpleshop.data.infrastructure.ModelDAO;
import simpleshop.domain.model.Employee;
import simpleshop.dto.EmployeeSearch;
import simpleshop.service.EmployeeService;
import simpleshop.service.infrastructure.impl.ModelServiceImpl;

@Service
public class EmployeeServiceImpl extends ModelServiceImpl<Employee, EmployeeSearch> implements EmployeeService {

    @Autowired
    private EmployeeDAO employeeDAO;

    @Override
    protected ModelDAO getModelDAO() {
        return employeeDAO;
    }

    @Override
    public Employee create() {
        return new Employee();
    }

}
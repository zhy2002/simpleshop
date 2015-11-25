package simpleshop.webapp.mvc.controller;

import org.hibernate.Hibernate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import simpleshop.domain.model.Order;
import simpleshop.domain.model.Product;
import simpleshop.domain.model.User;
import simpleshop.domain.model.component.OrderItem;
import simpleshop.dto.CartItem;
import simpleshop.dto.CustomerOrder;
import simpleshop.dto.JsonResponse;
import simpleshop.dto.ShoppingCart;
import simpleshop.service.ProductService;
import simpleshop.service.UserService;

import javax.servlet.http.HttpSession;
import java.math.BigDecimal;


@RestController
@RequestMapping("/customer_order")
public class CustomerOrderController {

    @Autowired
    private UserService userService;

    @Autowired
    private ProductService productService;

    public static final String NO_SHOPPING_CART_FOUND = "Not shopping cart found";
    public static final String NO_SHOPPING_CART_ITEM_FOUND = "Not shopping cart item found";

    @Transactional(readOnly = true)
    @RequestMapping(value = "/new", method = RequestMethod.GET)
    public JsonResponse<CustomerOrder> create(HttpSession session){

        ShoppingCart cart = (ShoppingCart)session.getAttribute(CartController.SHOPPING_CART_SESSION_KEY);
        if(cart == null){
            return JsonResponse.createError(NO_SHOPPING_CART_FOUND, null);
        }
        if(cart.getItems().size() == 0){
            return JsonResponse.createError(NO_SHOPPING_CART_ITEM_FOUND, null);
        }

        CustomerOrder customerOrder = new CustomerOrder();
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if(auth == null){
            return JsonResponse.createError("Not authenticated", null);
        }
        String username = auth.getName();
        User user = userService.findUser(username);
        if(user == null){
            return JsonResponse.createError("Not user with name '" + username + "' found", null);
        }
        if(user.getCustomer() != null){
            if(user.getCustomer().getContact().getContactName() == null){
                user.getCustomer().getContact().setContactName(user.getCustomer().getContact().getName());
            }
        }
        customerOrder.setCustomer(user.getCustomer());

        Order order = new Order();
        for(CartItem cartItem : cart.getItems()){
            OrderItem orderItem = new OrderItem();

            Product product = productService.getById(cartItem.getProductId());
            orderItem.setProduct(product);
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setSellPrice(BigDecimal.TEN); //todo decide price
            order.getOrderItems().add(orderItem);
        }

        customerOrder.setOrder(order);
        return JsonResponse.createSuccess(customerOrder);
    }
}
